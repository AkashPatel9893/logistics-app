import { request } from './client';
import type { CouponSummary, GeoPoint, OfferBanner, RideQuote, VehicleCatalog } from './models';

export interface QuoteInput {
  pickup: GeoPoint | null;
  drop: GeoPoint | null;
  couponCode: string | null;
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
        imageKey: 'truck',
      };
    });
    return {
      featured: list.slice(0, 1),
      standard: list,
    };
  },

  getOfferBanners: async (_signal?: AbortSignal): Promise<OfferBanner[]> => {
    return [
      {
        id: 'offer-1',
        altText: 'Flat ₹50 OFF on your first 3 bookings',
        imageKey: 'discount',
      },
    ];
  },

  getQuote: async (input: QuoteInput, signal?: AbortSignal): Promise<RideQuote> => {
    // Fetch available vehicle type id
    const types = await request<any[]>({ url: '/vehicle-types', signal });
    const vtype = types[0];
    const vehicleTypeId = vtype?.id;

    const res = await request<any>({
      method: 'POST',
      url: '/pricing/quote',
      data: {
        vehicle_type_id: vehicleTypeId,
        stops: [
          {
            latitude: input.pickup?.latitude ?? 12.9716,
            longitude: input.pickup?.longitude ?? 77.5946,
          },
          {
            latitude: input.drop?.latitude ?? 12.9352,
            longitude: input.drop?.longitude ?? 77.6245,
          },
        ],
      },
      signal,
    });

    const distanceKm = res.distance_meters ? Number((res.distance_meters / 1000).toFixed(1)) : 5.2;
    const totalFare = Number(res.total_amount ?? 106.88);

    const quoteResult: RideQuote = {
      distanceKm,
      couponCode: input.couponCode,
      options: [
        {
          vehicleId: vehicleTypeId ?? 'DEV_MINI_TRUCK',
          name: vtype?.display_name || 'NA',
          description: vtype?.description ?? `${Number(vtype?.max_payload_kg) || 0} kg capacity`,
          imageKey: 'truck',
          etaMinutes: 4,
          fare: totalFare,
          coupon: input.couponCode ? { valid: true, discount: 50 } : null,
        },
      ],
    };
    (quoteResult as any).quoteId = res.id;
    return quoteResult;
  },

  validateCoupon: async (code: string): Promise<CouponSummary> => {
    return {
      code: code.toUpperCase(),
      title: '₹50 Flat Discount',
      description: 'Applied successfully',
    };
  },
};
