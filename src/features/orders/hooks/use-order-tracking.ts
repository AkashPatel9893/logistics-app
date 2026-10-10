import { useQueryClient } from '@tanstack/react-query';

import { useEffect } from 'react';

import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useNow } from '@/hooks/use-now';
import { useOrder } from '@/hooks/use-orders';
import { useRoadRoute } from '@/hooks/use-road-route';
import type { DriverLocation, GeoPoint, Order, OrderStatus } from '@/lib/api/models';
import { computeBounds, remainingPath, type GeoBounds } from '@/lib/geo';
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

  if (status === 'heading_to_pickup' || status === 'arrived_at_pickup') {
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

  // On the way to drop the line is only what's left of the trip, so it shortens as the driver moves.
  const isToDrop = status === 'pickup_complete' || status === 'arrived_at_drop';
  const remaining = isToDrop && live?.leg === 'to_drop' && live.path.length >= 2 ? live.path : null;
  const shown = remaining ?? route;

  return {
    route: shown,
    bounds: computeBounds(shown),
    endMarker: 'drop',
    showStartMarker: status === 'searching',
    driverPosition:
      status === 'delivered'
        ? drop
        : status === 'pickup_complete' || status === 'arrived_at_drop'
          ? (live?.location ?? null)
          : null,
  };
}

const COUNTDOWN_TICK_MS = 10_000;
/** A driver this far from the drawn road path has taken another road: re-route. */
const REROUTE_AFTER_KM = 0.3;

/**
 * Road-following route for the order, plus the driver's current leg built from
 * the polled position: the road path still ahead of the driver.
 */
function useRoadTracking(order: Order | undefined) {
  const status = order?.status;
  const pickup = order?.route[0] ?? null;
  const drop = order ? order.route[order.route.length - 1] : null;
  const driver = order?.driverLocation ?? null;
  const leg =
    status === 'heading_to_pickup' || status === 'arrived_at_pickup'
      ? 'to_pickup'
      : status === 'pickup_complete' || status === 'arrived_at_drop'
        ? 'to_drop'
        : null;

  const planned = useRoadRoute(`${order?.id}:trip`, pickup, drop, order?.route.slice(1, -1));
  // The driver starts the pickup leg from wherever they accepted the job.
  const approach = useRoadRoute(
    `${order?.id}:to-pickup`,
    leg === 'to_pickup' ? driver : null,
    pickup,
  );

  const legRoute = leg === 'to_pickup' ? approach : planned;
  const ahead = leg && driver && legRoute.data ? remainingPath(legRoute.data, driver) : null;

  const offPath = (ahead?.offPathKm ?? 0) > REROUTE_AFTER_KM;
  const { refetch, isFetching } = approach;
  useEffect(() => {
    // Only the approach is re-routed from the driver; the planned trip stays pickup → drop.
    if (leg === 'to_pickup' && offPath && !isFetching) void refetch();
  }, [leg, offPath, isFetching, refetch]);

  const live: DriverLocation | null =
    leg && driver
      ? {
          location: driver,
          leg,
          // Straight line to the stop until (or unless) a road path is available.
          path: ahead?.path ?? [driver, leg === 'to_pickup' ? pickup! : drop!],
          updatedAt: new Date().toISOString(),
        }
      : null;

  return { route: planned.data ?? order?.route ?? [], live };
}

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
  const road = useRoadTracking(order);

  const minutesUntilDriver = order
    ? Math.max(0, Math.ceil((Date.parse(order.driverAssignAt) - now) / 60_000))
    : 0;

  return {
    orderQuery,
    order,
    minutesUntilDriver,
    // The socket's location wins when the server pushes one; otherwise the polled position.
    map: order ? buildTrackingMap(order.status, road.route, liveLocation ?? road.live) : null,
  };
}
