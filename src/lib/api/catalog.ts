import { ApiError } from './api-error';
import { request } from './client';
import type { CouponSummary, GeoPoint, OfferBanner, RideQuote, VehicleCatalog } from './models';

export interface QuoteInput {
  pickup: GeoPoint | null;
  drop: GeoPoint | null;
  /** Stops visited between pickup and drop, in order. */
  via?: GeoPoint[];
  couponCode: string | null;
}

/**
 * Fare before discount and what the coupon really took off, from the backend's
 * own figures — the app never computes or assumes a discount.
 */
function requiredAmount(value: unknown): number {
  if (value == null || value === '' || !Number.isFinite(Number(value))) {
    throw new Error('The price is unavailable. Please try again.');
  }
  return Number(value);
}

function quoteAmounts(res: any, couponCode: string | null, couponRejection: string | null) {
  const total = requiredAmount(res.total_amount);
  const discount = requiredAmount(res.discount_amount);
  return {
    // Rounded to paise: adding the two floats can yield 80.22999999999999.
    fare: Math.round((total + discount) * 100) / 100,
    coupon: !couponCode
      ? null
      : discount > 0
        ? ({ valid: true, discount } as const)
        : ({
            valid: false,
            reason: couponRejection ?? 'This coupon does not apply to this vehicle or fare.',
          } as const),
  };
}

export interface AppRules {
  maxOrderStops: number;
  otpLength: number;
}

export const catalogApi = {
  /** Public server rules (stop limit, OTP length); no login needed. */
  getRules: async (signal?: AbortSignal): Promise<AppRules> => {
    const res = await request<any>({ url: '/config', signal });
    return { maxOrderStops: Number(res.max_order_stops), otpLength: Number(res.otp_length) };
  },

  isServiceable: async ({ latitude, longitude }: GeoPoint): Promise<boolean> => {
    const res = await request<{ serviceable: boolean }>({
      url: '/serviceability',
      params: { lat: latitude, lng: longitude },
    });
    return res.serviceable;
  },

  getVehicles: async (signal?: AbortSignal): Promise<VehicleCatalog> => {
    const res = await request<any[]>({ url: '/vehicle-types', signal });
    const list = (res ?? []).map((v) => {
      // Missing fields render as "NA" / 0 rather than blank or "undefined".
      const capacityKg = Number(v.max_payload_kg) || 0;
      return {
        id: v.id,
        name: v.display_name || '—',
        description: v.description ?? (capacityKg ? `${capacityKg} kg payload` : ''),
        capacityKg,
        imageUrl: v.image_url ?? null,
      };
    });
    return {
      // Two large tiles, the rest in the compact row — each vehicle appears once.
      featured: list.slice(0, 2),
      standard: list.slice(2),
    };
  },

  /** Live marketing / promotion banners for the customer's market. */
  getOfferBanners: async (signal?: AbortSignal): Promise<OfferBanner[]> => {
    try {
      const res = await request<any[]>({ url: '/offers/banners', signal });
      if (Array.isArray(res) && res.length > 0) {
        return res.map((b) => ({
          id: String(b.id),
          imageKey: b.image_key ?? b.id,
          imageUrl: b.image_url ?? null,
          altText: b.alt_text ?? 'Special Offer',
          couponCode: b.coupon_code ?? null,
        }));
      }
    } catch {}
    return [];
  },

  /** One priced option per vehicle type; each carries the quote id its order is booked with. */
  getQuote: async (input: QuoteInput, signal?: AbortSignal): Promise<RideQuote> => {
    // A price for made-up coordinates would mislead: both ends must be chosen.
    if (!input.pickup) throw new Error('Choose your pickup location to see prices.');
    if (!input.drop) throw new Error('Choose your drop location to see prices.');
    const types = await request<any[]>({ url: '/vehicle-types', signal });
    const stops = [input.pickup, ...(input.via ?? []), input.drop].map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    const requestQuote = (vehicleTypeId: string, couponCode: string | null) =>
      request<any>({
        method: 'POST',
        url: '/pricing/quote',
        data: {
          vehicle_type_id: vehicleTypeId,
          stops,
          ...(couponCode ? { coupon_code: couponCode } : {}),
        },
        signal,
      });

    const quotes = await Promise.allSettled(
      (types ?? []).map(async (vtype) => {
        try {
          return {
            ...(await requestQuote(vtype.id, input.couponCode)),
            couponRejection: null,
          };
        } catch (error) {
          // A coupon that doesn't fit this vehicle must not remove the vehicle from the choice:
          // it stays at its normal fare and says why the coupon didn't apply.
          const isCouponError =
            input.couponCode && error instanceof ApiError && error.code?.startsWith('COUPON_');
          if (!isCouponError) throw error;
          return {
            ...(await requestQuote(vtype.id, null)),
            couponRejection: error.message,
          };
        }
      }),
    );

    // A vehicle type with no rate card simply isn't offered.
    const priced = quotes.flatMap((quote, index) =>
      quote.status === 'fulfilled' ? [{ vtype: types[index], res: quote.value }] : [],
    );
    if (priced.length === 0) {
      const failed = quotes.find((quote) => quote.status === 'rejected');
      throw failed?.status === 'rejected' ? failed.reason : new Error('No vehicles available');
    }

    const meters = priced[0].res.distance_meters;
    return {
      distanceKm: meters ? Number((meters / 1000).toFixed(1)) : null,
      couponCode: input.couponCode,
      options: priced.map(({ vtype, res }) => ({
        vehicleId: vtype.id,
        quoteId: res.id,
        name: vtype.display_name || '—',
        description:
          vtype.description ??
          (Number(vtype.max_payload_kg) ? `${Number(vtype.max_payload_kg)} kg capacity` : ''),
        imageUrl: vtype.image_url ?? null,
        // No pickup ETA from the backend yet — shown only when it sends one.
        etaMinutes: res.pickup_eta_seconds ? Math.ceil(res.pickup_eta_seconds / 60) : null,
        ...quoteAmounts(res, input.couponCode, res.couponRejection),
        breakdown: {
          lines: (res.components ?? []).map((line: any) => ({
            type: line.component_type,
            // The backend's "Distance (4.467 km billable)" is written for its own records.
            label:
              line.component_type === 'DISTANCE_CHARGE'
                ? `Extra distance (${Number(line.quantity).toFixed(1)} km)`
                : line.description,
            amount: requiredAmount(line.amount),
          })),
          subtotal: requiredAmount(res.subtotal),
          tax: requiredAmount(res.tax_amount),
          discount: requiredAmount(res.discount_amount),
          total: requiredAmount(res.total_amount),
        },
      })),
    };
  },

  /** Looks the code up in the customer's available coupons; throws when it isn't one of them. */
  validateCoupon: async (code: string): Promise<CouponSummary> => {
    const wanted = code.trim().toUpperCase();
    const coupons = await request<any[]>({ url: '/coupons' });
    const match = (coupons ?? []).find((c) => String(c.code).toUpperCase() === wanted);
    if (!match) throw new Error('This coupon code is not valid for your account.');
    return { code: match.code, title: match.title, description: match.description };
  },
};
