import type { CreateOrderInput, OrderStop, SharedTracking, TrackingShare } from '@/lib/api/models';

import { db, type OrderRecord } from '../db';
import type { MockRequest } from '../http';
import {
  body,
  created,
  HttpError,
  ok,
  randomDigits,
  randomId,
  randomInt,
  requireUser,
} from '../http';
import { resolveStatus, toOrder } from '../lifecycle';
import { checkCoupon, fareFor, findCoupon, roadDistanceKm } from '../pricing';
import { DRIVERS, FALLBACK_ROUTE, RIDE_RATES } from '../seed';
import type { Route } from './types';
import { walletFor } from './wallet';

// Demo driver-matching wait, kept short so the demo moves along.
const MIN_ASSIGN_MS = 8_000;
const MAX_ASSIGN_MS = 25_000;
const SHARE_TTL_MS = 24 * 60 * 60_000;
export const PUBLIC_TRACKING_BASE_URL = 'https://ryno.app/track';

function ownedOrder(req: MockRequest): OrderRecord {
  const userId = requireUser(req);
  const record = db.orders.get(req.params.id);
  if (!record || record.userId !== userId) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }
  return record;
}

function validateStop(stop: OrderStop | undefined, name: string): OrderStop {
  if (!stop?.label?.trim())
    throw new HttpError(422, 'INVALID_STOP', `${name} address is required.`);
  return stop;
}

function newOtp(exclude?: string): string {
  let otp = randomDigits(4);
  while (otp === exclude) otp = randomDigits(4);
  return otp;
}

export const orderRoutes: Route[] = [
  {
    method: 'POST',
    path: '/orders',
    handler: (req) => {
      const userId = requireUser(req);
      const input = body<CreateOrderInput>(req);
      const pickup = validateStop(input.pickup, 'Pickup');
      const drop = validateStop(input.drop, 'Drop');
      const rate = RIDE_RATES.find((r) => r.vehicleId === input.vehicleId);
      if (!rate) throw new HttpError(422, 'INVALID_VEHICLE', 'Choose a vehicle.');

      const wallet = walletFor(userId);
      const method = wallet.paymentMethods.find((m) => m.id === input.paymentMethodId);
      if (!method) throw new HttpError(422, 'INVALID_PAYMENT_METHOD', 'Choose a payment method.');

      // Pricing is always recomputed server-side; the client quote is display-only.
      const distanceKm = roadDistanceKm(pickup.location, drop.location);
      const fare = fareFor(rate, distanceKm);
      const coupon = findCoupon(input.couponCode);
      const check = coupon ? checkCoupon(coupon, fare, rate.vehicleId) : null;
      const discount = check?.valid ? check.discount : 0;

      const now = Date.now();
      const pickupOtp = newOtp();
      const record: OrderRecord = {
        id: randomId('ord'),
        number: `RY${now.toString(36).slice(-5).toUpperCase()}`,
        createdAt: new Date(now).toISOString(),
        userId,
        pickup,
        drop,
        vehicle: { id: rate.vehicleId, name: rate.name, imageKey: rate.imageKey },
        pricing: {
          fare,
          discount,
          payable: fare - discount,
          couponCode: discount > 0 ? (coupon?.code ?? null) : null,
          distanceKm,
        },
        payment: { methodLabel: method.label, timing: input.paymentTiming },
        etaMinutes: rate.etaMinutes,
        driverAssignAt: new Date(now + randomInt(MIN_ASSIGN_MS, MAX_ASSIGN_MS)).toISOString(),
        // A driver with the booked vehicle type (any driver as a fallback).
        assignedDriverId: (
          DRIVERS.find((d) => d.vehicleLabel === rate.name) ??
          DRIVERS[randomInt(0, DRIVERS.length - 1)]
        ).id,
        pickupOtp,
        deliveryOtp: newOtp(pickupOtp),
        route: pickup.location && drop.location ? [pickup.location, drop.location] : FALLBACK_ROUTE,
        rating: null,
        cancelledAt: null,
      };
      db.orders.set(record.id, record);
      return created(toOrder(record, now), 'Order placed');
    },
  },
  {
    method: 'GET',
    path: '/orders',
    handler: (req) => {
      const userId = requireUser(req);
      const now = Date.now();
      return ok(
        db.orders
          .all()
          .filter((o) => o.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((o) => toOrder(o, now)),
      );
    },
  },
  {
    method: 'GET',
    path: '/orders/:id',
    handler: (req) => ok(toOrder(ownedOrder(req))),
  },
  {
    method: 'POST',
    path: '/orders/:id/cancel',
    handler: (req) => {
      const record = ownedOrder(req);
      const status = resolveStatus(record);
      if (
        status !== 'searching' &&
        status !== 'heading_to_pickup' &&
        status !== 'arrived_at_pickup'
      ) {
        throw new HttpError(409, 'CANNOT_CANCEL', 'Your package has already been picked up.');
      }
      const updated = db.orders.set(record.id, {
        ...record,
        cancelledAt: new Date().toISOString(),
      });
      return ok(toOrder(updated), 'Order cancelled');
    },
  },
  {
    method: 'POST',
    path: '/orders/:id/rating',
    handler: (req) => {
      const record = ownedOrder(req);
      const rating = Number(body<{ rating: number }>(req).rating);
      if (resolveStatus(record) !== 'delivered') {
        throw new HttpError(409, 'NOT_DELIVERED', 'You can rate once the order is delivered.');
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new HttpError(422, 'INVALID_RATING', 'Rating must be 1 to 5.');
      }
      return ok(toOrder(db.orders.set(record.id, { ...record, rating })), 'Thanks for rating');
    },
  },
  {
    method: 'POST',
    path: '/orders/:id/share',
    handler: (req) => {
      const record = ownedOrder(req);
      const now = Date.now();
      const token = randomId('trk').replace('trk_', '');
      const expiresAt = new Date(now + SHARE_TTL_MS).toISOString();
      db.shares.set(token, { orderId: record.id, expiresAt });
      const share: TrackingShare = {
        token,
        url: `${PUBLIC_TRACKING_BASE_URL}/${token}`,
        expiresAt,
      };
      return created(share, 'Tracking link created');
    },
  },
  {
    // Public (no auth): what the receiver sees from a shared link.
    method: 'GET',
    path: '/tracking/:token',
    handler: (req) => {
      const share = db.shares.get(req.params.token);
      if (!share) throw new HttpError(404, 'LINK_NOT_FOUND', 'This tracking link is not valid.');
      if (Date.parse(share.expiresAt) < Date.now()) {
        throw new HttpError(410, 'LINK_EXPIRED', 'This tracking link has expired.');
      }
      const record = db.orders.get(share.orderId);
      if (!record) throw new HttpError(404, 'LINK_NOT_FOUND', 'This tracking link is not valid.');
      const order = toOrder(record);
      const sender = db.users.get(record.userId);
      const tracking: SharedTracking = {
        orderNumber: order.number,
        status: order.status,
        senderName: record.pickup.contact?.name || sender?.name || 'Sender',
        pickupLabel: order.pickup.label,
        dropLabel: order.drop.label,
        vehicleName: order.vehicle.name,
        vehicleImageKey: order.vehicle.imageKey,
        etaMinutes: order.etaMinutes,
        driverAssignAt: order.driverAssignAt,
        driver: order.driver
          ? {
              name: order.driver.name,
              rating: order.driver.rating,
              phone: order.driver.phone,
              vehicleLabel: order.driver.vehicleLabel,
              vehiclePlate: order.driver.vehiclePlate,
            }
          : null,
        deliveryOtp: order.deliveryOtp,
        route: order.route,
      };
      return ok(tracking);
    },
  },
];
