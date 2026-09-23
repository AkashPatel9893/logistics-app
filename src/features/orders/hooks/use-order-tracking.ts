import { useQueryClient } from '@tanstack/react-query';

import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useNow } from '@/hooks/use-now';
import { useOrder } from '@/hooks/use-orders';
import type { DriverLocation, GeoPoint, OrderStatus } from '@/lib/api/models';
import { computeBounds, type GeoBounds } from '@/lib/geo';
import { queryKeys } from '@/lib/queries/keys';
import { orderChannel } from '@/lib/realtime/tracking-socket';

export interface TrackingMapState {
  route: GeoPoint[];
  bounds: GeoBounds | undefined;
  /** Endpoint marker at the end of `route`. */
  endMarker: 'pickup' | 'drop';
  /** Pickup marker at the start of `route` (route preview while searching). */
  showStartMarker: boolean;
  driverPosition: GeoPoint | null;
}

/**
 * What the tracking map shows for an order: the planned route while
 * searching, then the driver's live leg from the socket.
 */
export function buildTrackingMap(
  status: OrderStatus,
  route: GeoPoint[],
  live: DriverLocation | null,
): TrackingMapState | null {
  if (status === 'cancelled' || route.length < 2) return null;
  const pickup = route[0];
  const drop = route[route.length - 1];

  if (status === 'heading_to_pickup') {
    const path = live?.leg === 'to_pickup' ? live.path : [pickup];
    const shown = path.length >= 2 ? path : route;
    return {
      route: shown,
      bounds: computeBounds(shown),
      endMarker: path.length >= 2 ? 'pickup' : 'drop',
      showStartMarker: path.length < 2,
      driverPosition: live?.location ?? null,
    };
  }

  return {
    route,
    bounds: computeBounds(route),
    endMarker: 'drop',
    showStartMarker: status === 'searching',
    driverPosition:
      status === 'delivered'
        ? drop
        : status === 'pickup_complete'
          ? (live?.location ?? null)
          : null,
  };
}

const COUNTDOWN_TICK_MS = 10_000;

/** Sender-side tracking: order from the API, live updates from the socket. */
export function useOrderTracking(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const isLive = order ? order.status !== 'delivered' && order.status !== 'cancelled' : false;

  const liveLocation = useLiveTracking(orderId && isLive ? orderChannel(orderId) : null, () => {
    // A status push means the order changed server-side: refetch it (and the list).
    if (!orderId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true });
  });
  const now = useNow(COUNTDOWN_TICK_MS);

  const minutesUntilDriver = order
    ? Math.max(0, Math.ceil((Date.parse(order.driverAssignAt) - now) / 60_000))
    : 0;

  return {
    orderQuery,
    order,
    minutesUntilDriver,
    map: order ? buildTrackingMap(order.status, order.route, liveLocation) : null,
  };
}
