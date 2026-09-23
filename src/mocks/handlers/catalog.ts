import type { CouponSummary, GeoPoint, VehicleCatalog } from '@/lib/api/models';

import { body, HttpError, ok, requireUser } from '../http';
import { findCoupon, quote } from '../pricing';
import { FEATURED_VEHICLES, OFFER_BANNERS, STANDARD_VEHICLES } from '../seed';
import type { Route } from './types';

export const catalogRoutes: Route[] = [
  {
    method: 'GET',
    path: '/vehicles',
    handler: () => {
      const catalog: VehicleCatalog = { featured: FEATURED_VEHICLES, standard: STANDARD_VEHICLES };
      return ok(catalog);
    },
  },
  {
    method: 'GET',
    path: '/offers/banners',
    handler: () => ok(OFFER_BANNERS),
  },
  {
    method: 'POST',
    path: '/rides/quote',
    handler: (req) => {
      requireUser(req);
      const input = body<{
        pickup: GeoPoint | null;
        drop: GeoPoint | null;
        couponCode?: string | null;
      }>(req);
      return ok(quote(input.pickup, input.drop, input.couponCode ?? null));
    },
  },
  {
    method: 'POST',
    path: '/coupons/validate',
    handler: (req) => {
      requireUser(req);
      const coupon = findCoupon(body<{ code: string }>(req).code);
      if (!coupon) throw new HttpError(404, 'INVALID_COUPON', 'Invalid coupon code');
      const summary: CouponSummary = {
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
      };
      return ok(summary);
    },
  },
];
