import { request } from './client';
import type { CouponSummary, GeoPoint, OfferBanner, RideQuote, VehicleCatalog } from './models';

export interface QuoteInput {
  pickup: GeoPoint | null;
  drop: GeoPoint | null;
  /** Stops visited between pickup and drop, in order. */
  via?: GeoPoint[];
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

  /** One priced option per vehicle type; each carries the quote id its order is booked with. */
  getQuote: async (input: QuoteInput, signal?: AbortSignal): Promise<RideQuote> => {
    const types = await request<any[]>({ url: '/vehicle-types', signal });
    const stops = [
      {
        latitude: input.pickup?.latitude ?? 12.9716,
        longitude: input.pickup?.longitude ?? 77.5946,
      },
      ...(input.via ?? []),
      {
        latitude: input.drop?.latitude ?? 12.9352,
        longitude: input.drop?.longitude ?? 77.6245,
      },
    ];

    const quotes = await Promise.allSettled(
      (types ?? []).map((vtype) =>
        request<any>({
          method: 'POST',
          url: '/pricing/quote',
          data: { vehicle_type_id: vtype.id, stops },
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
        imageKey: 'truck',
        etaMinutes: 4,
        fare: Number(res.total_amount ?? 0),
        coupon: input.couponCode ? { valid: true, discount: 50 } : null,
      })),
    };
  },

  validateCoupon: async (code: string): Promise<CouponSummary> => {
    return {
      code: code.toUpperCase(),
      title: '₹50 Flat Discount',
      description: 'Applied successfully',
    };
  },
};
