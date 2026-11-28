import { ApiError } from './api-error';
import { request } from './client';
import type {
  Coupon,
  CouponSummary,
  GeoPoint,
  OfferBanner,
  RideQuote,
  RideQuoteOption,
  VehicleCatalog,
} from './models';

export interface QuoteInput {
  pickup: GeoPoint | null;
  drop: GeoPoint | null;
  via?: GeoPoint[];
  couponCode: string | null;
  priority?: boolean;
}

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

function mapRideQuoteOption(
  vtype: any,
  res: any,
  couponCode: string | null,
  etaByType: Map<string, number>,
): RideQuoteOption {
  return {
    vehicleId: vtype.id,
    quoteId: res.id,
    name: vtype.display_name || '—',
    vehicleCode: vtype.code ?? null,
    description:
      vtype.description ??
      (Number(vtype.max_payload_kg) ? `${Number(vtype.max_payload_kg)} kg capacity` : ''),
    imageUrl: vtype.image_url ?? null,
    etaMinutes: etaByType.get(String(vtype.id)) ?? null,
    ...quoteAmounts(res, couponCode, res.couponRejection),
    priority: {
      available: Boolean(res.priority_available),
      active: Boolean(res.is_priority),
      amount: res.priority_amount != null ? Number(res.priority_amount) : null,
    },
    breakdown: {
      lines: (res.components ?? []).map((line: any) => ({
        type: line.component_type,
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
  };
}

export interface AppRules {
  maxOrderStops: number;
  otpLength: number;
  bookingRules?: string[];
  restrictedItems?: string[];
}

function toTextList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== '',
  );
  return items.length > 0 ? items : undefined;
}

export const catalogApi = {
  getRules: async (signal?: AbortSignal): Promise<AppRules> => {
    const res = await request<any>({ url: '/config', signal });
    return {
      maxOrderStops: Number(res.max_order_stops),
      otpLength: Number(res.otp_length),
      bookingRules: toTextList(res.booking_rules),
      restrictedItems: toTextList(res.restricted_items),
    };
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
      const capacityKg = Number(v.max_payload_kg) || 0;
      return {
        id: v.id,
        name: v.display_name || '—',
        description: v.description ?? (capacityKg ? `${capacityKg} kg payload` : ''),
        capacityKg,
        code: v.code ?? null,
        category: v.category ?? null,
        cargoSizeCm:
          v.cargo_length_cm && v.cargo_width_cm && v.cargo_height_cm
            ? {
                length: Number(v.cargo_length_cm),
                width: Number(v.cargo_width_cm),
                height: Number(v.cargo_height_cm),
              }
            : null,
        imageUrl: v.image_url ?? null,
      };
    });
    return {
      featured: list.slice(0, 2),
      standard: list.slice(2),
    };
  },

  /** Counts a banner view or tap for its campaign; never blocks or fails the screen. */
  trackBanner: (campaignId: string, type: 'IMPRESSION' | 'CLICK'): void => {
    request({
      method: 'POST',
      url: '/marketing/events',
      data: { campaign_id: campaignId, type },
    }).catch(() => undefined);
  },

  getOfferBanners: async (signal?: AbortSignal): Promise<OfferBanner[]> => {
    try {
      const res = await request<any[]>({ url: '/offers/banners', signal });
      if (Array.isArray(res) && res.length > 0) {
        return res
          .filter((b) => typeof b.image_url === 'string' && b.image_url.length > 0)
          .map((b) => ({
            id: String(b.id),
            imageUrl: b.image_url,
            altText: b.alt_text ?? '',
            couponCode: b.coupon_code ?? null,
          }));
      }
    } catch {}
    return [];
  },

  getQuote: async (input: QuoteInput, signal?: AbortSignal): Promise<RideQuote> => {
    if (!input.pickup) throw new Error('Choose your pickup location to see prices.');
    if (!input.drop) throw new Error('Choose your drop location to see prices.');
    const [types, nearby] = await Promise.all([
      request<any[]>({ url: '/vehicle-types', signal }),
      request<any>({
        url: '/vehicles/nearby',
        params: { lat: input.pickup.latitude, lng: input.pickup.longitude },
        signal,
      }).catch(() => null),
    ]);
    const etaByType = new Map<string, number>(
      (nearby?.vehicles ?? [])
        .filter((v: any) => typeof v.nearest_eta_minutes === 'number')
        .map((v: any) => [String(v.vehicle_type_id), v.nearest_eta_minutes]),
    );
    const stops = [input.pickup, ...(input.via ?? []), input.drop].map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    const requestQuote = (vehicleTypeId: string, couponCode: string | null, priority: boolean) =>
      request<any>({
        method: 'POST',
        url: '/pricing/quote',
        data: {
          vehicle_type_id: vehicleTypeId,
          stops,
          ...(couponCode ? { coupon_code: couponCode } : {}),
          ...(priority ? { priority: true } : {}),
        },
        signal,
      });

    const quoteVehicle = async (
      vehicleTypeId: string,
      couponCode: string | null,
      priority: boolean,
    ): Promise<any> => {
      try {
        return {
          ...(await requestQuote(vehicleTypeId, couponCode, priority)),
          couponRejection: null,
        };
      } catch (error) {
        if (priority && error instanceof ApiError && error.code === 'PRIORITY_NOT_AVAILABLE') {
          return quoteVehicle(vehicleTypeId, couponCode, false);
        }
        const isCouponError =
          couponCode && error instanceof ApiError && error.code?.startsWith('COUPON_');
        if (isCouponError) {
          const fallback = await quoteVehicle(vehicleTypeId, null, priority);
          return {
            ...fallback,
            couponRejection: error.message,
          };
        }
        throw error;
      }
    };

    const quotes = await Promise.allSettled(
      (types ?? []).map((vtype) =>
        quoteVehicle(vtype.id, input.couponCode, Boolean(input.priority)),
      ),
    );

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
      options: priced.map(({ vtype, res }) =>
        mapRideQuoteOption(vtype, res, input.couponCode, etaByType),
      ),
    };
  },

  listCoupons: async (signal?: AbortSignal): Promise<Coupon[]> => {
    const coupons = await request<any[]>({ url: '/coupons', signal });
    return (coupons ?? []).map((c) => ({
      code: String(c.code),
      title: c.title ?? String(c.code),
      description: c.description ?? '',
      discountType: String(c.discount_type ?? '').toUpperCase(),
      discountValue: Number(c.discount_value) || 0,
      maxDiscount: c.max_discount != null ? Number(c.max_discount) : null,
      minFare: c.min_fare != null ? Number(c.min_fare) : null,
      vehicleTypeCodes: Array.isArray(c.vehicle_type_codes) ? c.vehicle_type_codes : null,
      validUntil: c.valid_until ?? null,
    }));
  },

  validateCoupon: async (code: string): Promise<CouponSummary> => {
    const wanted = code.trim().toUpperCase();
    const coupons = await request<any[]>({ url: '/coupons' });
    const match = (coupons ?? []).find((c) => String(c.code).toUpperCase() === wanted);
    if (!match) throw new Error('This coupon code is not valid for your account.');
    return { code: match.code, title: match.title, description: match.description };
  },
};
