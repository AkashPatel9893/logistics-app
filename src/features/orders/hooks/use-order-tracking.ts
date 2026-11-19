import { useQueryClient } from '@tanstack/react-query';

import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useNow } from '@/hooks/use-now';
import type { Order } from '@/lib/api/models';
import { queryKeys, useOrder } from '@/queries';

import { buildLiveEta, buildTrackingMap } from '../tracking-geometry';
import { useRoadTracking } from './use-road-tracking';

const COUNTDOWN_TICK_MS = 10_000;
const LOCATION_FRESHNESS_MS = 120_000;

function resolveLiveDriverLocation(
  order: Order | undefined,
  pushedDriver: ReturnType<typeof useLiveTracking>,
  now: number,
) {
  const socketTime = Date.parse(pushedDriver?.recordedAt ?? '');
  const apiTime = Date.parse(order?.driverLocationRecordedAt ?? '');
  const socketIsNewest =
    pushedDriver != null &&
    Number.isFinite(socketTime) &&
    (!Number.isFinite(apiTime) || socketTime >= apiTime);
  const locationTime = socketIsNewest ? socketTime : apiTime;
  const isStale = socketIsNewest ? pushedDriver.stale : (order?.driverLocationStale ?? true);
  const isCurrent =
    !isStale && Number.isFinite(locationTime) && now - locationTime < LOCATION_FRESHNESS_MS;

  return {
    isCurrent,
    orderWithFreshLocation: order && !isCurrent ? { ...order, driverLocation: null } : order,
    pushedPosition: socketIsNewest && isCurrent ? (pushedDriver.position ?? null) : null,
  };
}

export function useOrderTracking(orderId: string | undefined) {
  const queryClient = useQueryClient();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const isLive = order ? order.status !== 'delivered' && order.status !== 'cancelled' : false;

  const pushedDriver = useLiveTracking(order?.tripId && isLive ? order.tripId : null, () => {
    if (!orderId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders });
  });
  const now = useNow(COUNTDOWN_TICK_MS);
  const { isCurrent, orderWithFreshLocation, pushedPosition } = resolveLiveDriverLocation(
    order,
    pushedDriver,
    now,
  );
  const road = useRoadTracking(orderWithFreshLocation, pushedPosition);

  const arrivedDropIndex = order ? order.stops.findIndex((stop) => stop.status === 'arrived') : -1;

  return {
    orderQuery,
    order,
    locationStale: Boolean(order?.tripId && !isCurrent),
    map: order
      ? buildTrackingMap(
          order.status === 'arrived_at_drop' &&
            order.stops.length > 1 &&
            !order.stops.some((stop) => stop.status === 'arrived')
            ? 'pickup_complete'
            : order.status,
          order.status === 'arrived_at_pickup' || order.status === 'arrived_at_drop'
            ? order.route
            : road.route,
          road.live,
          arrivedDropIndex >= 0 ? arrivedDropIndex : undefined,
        )
      : null,
    liveEta: order ? buildLiveEta(order, road.live, now) : null,
  };
}
