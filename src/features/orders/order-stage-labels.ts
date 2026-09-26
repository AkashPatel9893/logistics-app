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
  arrived_at_pickup: 'Driver has arrived — share your OTP',
  pickup_complete: 'Package picked up',
  arrived_at_drop: 'Driver is at the drop location',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
};

/** Timeline steps shown on tracking screens, in order. */
export const TRACKING_STEPS: { id: OrderStatus; label: string }[] = [
  { id: 'searching', label: 'Finding your driver' },
  { id: 'heading_to_pickup', label: 'Heading to pickup' },
  { id: 'pickup_complete', label: 'Pickup complete' },
  { id: 'delivered', label: 'Delivered' },
];
