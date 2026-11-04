import type { OrderStatus } from '@/lib/api/models';

/** Short status copy for an order (lists, cards). */
export const ORDER_STAGE_LABEL: Record<OrderStatus, string> = {
  searching: 'Finding driver',
  heading_to_pickup: 'Driver on the way',
  arrived_at_pickup: 'Driver at pickup',
  pickup_complete: 'Out for delivery',
  arrived_at_drop: 'Driver at drop',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Headline copy for the tracking screens. */
export const ORDER_STAGE_HEADLINE: Record<OrderStatus, string> = {
  searching: 'Finding a nearby driver',
  heading_to_pickup: 'Driver on the way',
  arrived_at_pickup: 'Driver has arrived at pickup',
  pickup_complete: 'Package picked up',
  arrived_at_drop: 'Driver has arrived at the drop location',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
};

const formatDistance = (km: number) =>
  km < 1 ? `${Math.max(10, Math.round(km * 100) * 10)} m` : `${km.toFixed(1)} km`;

/** Live headline and detail while the driver is moving ("Pickup in 4 min", "Driver 1.2 km away"). */
export function liveEtaCopy(
  status: OrderStatus,
  eta: { minutes: number | null; distanceKm: number },
  isMultiStop: boolean,
): { headline: string; detail: string } {
  const distance = formatDistance(eta.distanceKm);
  if (status === 'heading_to_pickup') {
    return {
      headline: eta.minutes ? `Pickup in ${eta.minutes} min` : ORDER_STAGE_HEADLINE[status],
      detail: `Driver ${distance} away`,
    };
  }
  const target = isMultiStop ? 'next stop' : 'drop';
  return {
    headline: eta.minutes
      ? `Reaching ${target} in ${eta.minutes} min`
      : ORDER_STAGE_HEADLINE[status],
    detail: `${isMultiStop ? 'Next stop' : 'Drop'} is ${distance} away`,
  };
}

/** Timeline steps shown on tracking screens, in order. */
export const TRACKING_STEPS: { id: OrderStatus; label: string }[] = [
  { id: 'searching', label: 'Finding your driver' },
  { id: 'heading_to_pickup', label: 'Heading to pickup' },
  { id: 'pickup_complete', label: 'Pickup complete' },
  { id: 'delivered', label: 'Delivered' },
];
