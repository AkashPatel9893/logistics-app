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
function quoteAmounts(res: any, couponCode: string | null) {
  const total = Number(res.total_amount ?? 0);
  const discount = Number(res.discount_amount ?? 0);
  return {
    // Rounded to paise: adding the two floats can yield 80.22999999999999.
    fare: Math.round((total + discount) * 100) / 100,
    coupon: !couponCode
      ? null
      : discount > 0
        ? ({ valid: true, discount } as const)
        : ({
            valid: false,
            reason: 'This coupon does not apply to this vehicle or fare.',
          } as const),
  };
}

export const catalogApi = {
  getVehicles: async (signal?: AbortSignal): Promise<VehicleCatalog> => {
    const res = await request<any[]>({ url: '/vehicle-types', signal });
    const list = (res ?? []).map((v) => {
      // Missing fields render as "NA" / 0 rather than blank or "undefined".
      const capacityKg = Number(v.max_payload_kg) || 0;
      return {
        id: v.id,
        name: v.display_name || 'NA',
        description: v.description ?? `${capacityKg} kg payload`,
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

  /** No banner endpoint exists yet, so no offer is advertised. */
  getOfferBanners: async (_signal?: AbortSignal): Promise<OfferBanner[]> => {
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

    const quotes = await Promise.allSettled(
      (types ?? []).map((vtype) =>
        request<any>({
          method: 'POST',
          url: '/pricing/quote',
          data: {
            vehicle_type_id: vtype.id,
            stops,
            ...(input.couponCode ? { coupon_code: input.couponCode } : {}),
          },
          signal,
        }),
      ),
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
        name: vtype.display_name || 'NA',
        description: vtype.description ?? `${Number(vtype.max_payload_kg) || 0} kg capacity`,
        imageUrl: vtype.image_url ?? null,
        // No pickup ETA from the backend yet — shown only when it sends one.
        etaMinutes: res.pickup_eta_seconds ? Math.ceil(res.pickup_eta_seconds / 60) : null,
        ...quoteAmounts(res, input.couponCode),
        breakdown: {
          subtotal: Number(res.subtotal ?? 0),
          tax: Number(res.tax_amount ?? 0),
          discount: Number(res.discount_amount ?? 0),
          total: Number(res.total_amount ?? 0),
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
