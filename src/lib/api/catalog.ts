import { request } from './client';
import type { CouponSummary, GeoPoint, OfferBanner, RideQuote, VehicleCatalog } from './models';

export interface QuoteInput {
  pickup: GeoPoint | null;
  drop: GeoPoint | null;
  couponCode: string | null;
}

export const catalogApi = {
  getVehicles: (signal?: AbortSignal) => request<VehicleCatalog>({ url: '/vehicles', signal }),

  getOfferBanners: (signal?: AbortSignal) =>
    request<OfferBanner[]>({ url: '/offers/banners', signal }),

  getQuote: (input: QuoteInput, signal?: AbortSignal) =>
    request<RideQuote>({ method: 'POST', url: '/rides/quote', data: input, signal }),

  validateCoupon: (code: string) =>
    request<CouponSummary>({ method: 'POST', url: '/coupons/validate', data: { code } }),
};
