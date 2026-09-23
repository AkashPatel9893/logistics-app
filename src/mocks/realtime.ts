/**
 * In-process stand-in for the tracking WebSocket. Pushes the same events the
 * real server would (see docs/API.md) on a timer.
 */
import type { TrackingEvent } from '@/lib/realtime/events';

import { db } from './db';
import { driverLocation, resolveStatus, toOrder } from './lifecycle';

const TICK_MS = 2_000;

function orderIdFor(channel: string): string | null {
  if (channel.startsWith('order:')) return channel.slice('order:'.length);
  if (channel.startsWith('tracking:')) {
    return db.shares.get(channel.slice('tracking:'.length))?.orderId ?? null;
  }
  return null;
}

export function subscribeMockChannel(
  channel: string,
  onEvent: (event: TrackingEvent) => void,
): () => void {
  let lastStatus: string | null = null;

  const tick = () => {
    const orderId = orderIdFor(channel);
    const record = orderId ? db.orders.get(orderId) : undefined;
    if (!record) return;

    const status = resolveStatus(record);
    if (status !== lastStatus) {
      lastStatus = status;
      const order = toOrder(record);
      onEvent({ type: 'order.status', status, driver: order.driver, at: new Date().toISOString() });
    }
    const location = driverLocation(record);
    if (location) onEvent({ type: 'driver.location', ...location });
  };

  // First event right away, like a socket's initial snapshot.
  const first = setTimeout(tick, 0);
  const interval = setInterval(tick, TICK_MS);
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
}
