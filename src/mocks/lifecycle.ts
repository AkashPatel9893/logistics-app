/**
 * Simulated order lifecycle. A real backend moves orders forward from driver
 * app events (accept, pickup OTP verified, delivery OTP verified); the mock
 * derives the same states from elapsed time so the demo progresses on its own.
 */
import type { DriverLocation, Order, OrderStatus } from '@/lib/api/models';
import { interpolateAlongPath, lerpPoint, offsetPoint } from '@/lib/geo';

import type { OrderRecord } from './db';
import { DRIVERS } from './seed';

/**
 * Driver → pickup leg duration in the demo. Compressed from the vehicle's
 * `etaMinutes` (still shown to the user) so a whole order plays out in ~2 min.
 */
export const PICKUP_LEG_MS = 30_000;
/** Pickup → drop leg duration in the demo. */
export const DELIVERY_LEG_MS = 60_000;
const DRIVER_START_OFFSET_KM = 2.5;

function timeline(record: OrderRecord) {
  const assignAt = Date.parse(record.driverAssignAt);
  const pickupAt = assignAt + PICKUP_LEG_MS;
  return { assignAt, pickupAt, deliveredAt: pickupAt + DELIVERY_LEG_MS };
}

export function resolveStatus(record: OrderRecord, now = Date.now()): OrderStatus {
  if (record.cancelledAt) return 'cancelled';
  const { assignAt, pickupAt, deliveredAt } = timeline(record);
  if (now < assignAt) return 'searching';
  if (now < pickupAt) return 'heading_to_pickup';
  if (now < deliveredAt) return 'pickup_complete';
  return 'delivered';
}

/** Public order view: status and driver resolved for "now". */
export function toOrder(record: OrderRecord, now = Date.now()): Order {
  const status = resolveStatus(record, now);
  const cancelledBeforeAssign =
    record.cancelledAt !== null &&
    Date.parse(record.cancelledAt) < Date.parse(record.driverAssignAt);
  const hasDriver = status !== 'searching' && !cancelledBeforeAssign;
  const { userId: _userId, assignedDriverId, ...order } = record;
  return {
    ...order,
    status,
    driver: hasDriver ? (DRIVERS.find((d) => d.id === assignedDriverId) ?? null) : null,
  };
}

/** Where the driver is right now, or null when no driver is moving. */
export function driverLocation(record: OrderRecord, now = Date.now()): DriverLocation | null {
  const status = resolveStatus(record, now);
  const { assignAt, pickupAt } = timeline(record);
  const route = record.route;
  const pickup = route[0];
  const updatedAt = new Date(now).toISOString();

  if (status === 'heading_to_pickup') {
    const start = offsetPoint(pickup, DRIVER_START_OFFSET_KM);
    const progress = (now - assignAt) / (pickupAt - assignAt);
    const location = lerpPoint(start, pickup, Math.min(1, Math.max(0, progress)));
    return { location, leg: 'to_pickup', path: [location, pickup], updatedAt };
  }

  if (status === 'pickup_complete') {
    const progress = (now - pickupAt) / DELIVERY_LEG_MS;
    const location = interpolateAlongPath(route, progress);
    return { location, leg: 'to_drop', path: [location, route[route.length - 1]], updatedAt };
  }

  return null;
}
