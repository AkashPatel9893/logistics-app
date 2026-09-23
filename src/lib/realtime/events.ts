import type { Driver, DriverLocation, OrderStatus } from '@/lib/api/models';

/**
 * Messages pushed on a tracking channel (`order:<id>` for the sender,
 * `tracking:<token>` for a receiver with a shared link).
 */
export type TrackingEvent =
  | { type: 'order.status'; status: OrderStatus; driver: Driver | null; at: string }
  | ({ type: 'driver.location' } & DriverLocation);
