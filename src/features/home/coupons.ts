import { offersEndpoints } from '@/data/mock';

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  maxDiscount: number;
  minOrderValue: number;
  /** Vehicles the coupon applies to; `null` means every vehicle. */
  vehicleIds: string[] | null;
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  couponCode: string | null;
  theme: 'orange' | 'dark' | 'green';
}

export const COUPONS: Coupon[] = offersEndpoints.couponsEndpoint.data as Coupon[];

export const OFFER_BANNERS: OfferBanner[] = offersEndpoints.offerBannersEndpoint
  .data as OfferBanner[];

export function getCouponByCode(code: string | null | undefined): Coupon | undefined {
  if (!code) return undefined;
  return COUPONS.find((coupon) => coupon.code === code);
}

export type CouponResult = { ok: true; discount: number } | { ok: false; reason: string };

/** Validates a coupon against a fare and vehicle, returning the rupee discount. */
export function applyCoupon(coupon: Coupon, fare: number, vehicleId: string): CouponResult {
  if (coupon.vehicleIds && !coupon.vehicleIds.includes(vehicleId)) {
    return { ok: false, reason: 'Not valid for this vehicle' };
  }
  if (fare < coupon.minOrderValue) {
    return { ok: false, reason: `Add ₹${coupon.minOrderValue - fare} more to use this coupon` };
  }
  const rawDiscount =
    coupon.discountType === 'percent' ? (fare * coupon.discountValue) / 100 : coupon.discountValue;
  const discount = Math.min(Math.round(rawDiscount), coupon.maxDiscount, fare);
  return { ok: true, discount };
}
