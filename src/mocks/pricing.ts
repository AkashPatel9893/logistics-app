import type { CouponCheck, GeoPoint, RideQuote } from '@/lib/api/models';
import { distanceKm } from '@/lib/geo';

import { COUPON_RULES, RIDE_RATES, type CouponRule, type RideRate } from './seed';

// Straight-line distance understates road distance; a routing API replaces this.
const ROAD_DISTANCE_FACTOR = 1.3;
const MIN_BILLABLE_KM = 1;

export function roadDistanceKm(from: GeoPoint | null, to: GeoPoint | null): number | null {
  if (!from || !to) return null;
  const km = Math.max(MIN_BILLABLE_KM, distanceKm(from, to) * ROAD_DISTANCE_FACTOR);
  return Math.round(km * 10) / 10;
}

export function fareFor(rate: RideRate, km: number | null): number {
  return km === null ? rate.flatFare : Math.round(rate.baseFare + rate.perKmRate * km);
}

export function findCoupon(code: string | null | undefined): CouponRule | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return COUPON_RULES.find((coupon) => coupon.code === normalized);
}

export function checkCoupon(coupon: CouponRule, fare: number, vehicleId: string): CouponCheck {
  if (coupon.vehicleIds && !coupon.vehicleIds.includes(vehicleId)) {
    return { valid: false, reason: 'Not valid for this vehicle' };
  }
  if (fare < coupon.minOrderValue) {
    return { valid: false, reason: `Add ₹${coupon.minOrderValue - fare} more to use this coupon` };
  }
  const raw =
    coupon.discountType === 'percent' ? (fare * coupon.discountValue) / 100 : coupon.discountValue;
  return { valid: true, discount: Math.min(Math.round(raw), coupon.maxDiscount, fare) };
}

export function quote(
  pickup: GeoPoint | null,
  drop: GeoPoint | null,
  couponCode: string | null,
): RideQuote {
  const km = roadDistanceKm(pickup, drop);
  const coupon = findCoupon(couponCode);
  return {
    distanceKm: km,
    couponCode: coupon?.code ?? null,
    options: RIDE_RATES.map((rate) => {
      const fare = fareFor(rate, km);
      return {
        vehicleId: rate.vehicleId,
        name: rate.name,
        description: rate.description,
        imageKey: rate.imageKey,
        etaMinutes: rate.etaMinutes,
        fare,
        coupon: coupon ? checkCoupon(coupon, fare, rate.vehicleId) : null,
      };
    }),
  };
}
