import { useQueryClient } from '@tanstack/react-query';

import { useEffect, useRef, useState } from 'react';

import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useNow } from '@/hooks/use-now';
import { useOrder } from '@/hooks/use-orders';
import { useRoadRoute } from '@/hooks/use-road-route';
import type { DriverLocation, GeoPoint, Order, OrderStatus } from '@/lib/api/models';
import {
  computeBounds,
  headingAlongPath,
  pathDistanceKm,
  remainingPath,
  type GeoBounds,
} from '@/lib/geo';
import { queryKeys } from '@/lib/queries/keys';

export interface TrackingMapState {
  route: GeoPoint[];
  bounds: GeoBounds | undefined;
  /** Endpoint marker at the end of `route`. */
  endMarker: 'pickup' | 'drop';
  /** Pickup marker at the start of `route` (route preview while searching). */
  showStartMarker: boolean;
  driverPosition: GeoPoint | null;
  /** Direction the vehicle is heading, in compass degrees, from the road ahead of it. */
  driverHeading: number | null;
  /** Draw the route line. */
  showRoute: boolean;
  /** A finished trip's line is a faded summary, not a live route. */
  routeMuted: boolean;
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

  // Like Uber/Rapido: once delivered the live vehicle is gone; the trip stays as a faded summary line.
  if (status === 'delivered') {
    return {
      route,
      bounds: computeBounds(route),
      endMarker: 'drop',
      showStartMarker: true,
      driverPosition: null,
      driverHeading: null,
      showRoute: true,
      routeMuted: true,
    };
  }

  if (status === 'heading_to_pickup' || status === 'arrived_at_pickup') {
    const path = live?.leg === 'to_pickup' ? live.path : [pickup];
    const shown = path.length >= 2 ? path : route;
    return {
      route: shown,
      bounds: computeBounds(shown),
      endMarker: path.length >= 2 ? 'pickup' : 'drop',
      showStartMarker: path.length < 2,
      driverPosition: live?.location ?? null,
      driverHeading: live ? headingAlongPath(live.path) : null,
      showRoute: true,
      routeMuted: false,
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
      status === 'pickup_complete' || status === 'arrived_at_drop'
        ? (live?.location ?? null)
        : null,
    driverHeading: isToDrop && live ? headingAlongPath(live.path) : null,
    showRoute: true,
    routeMuted: false,
  };
}

export interface LiveEta {
  /** Null while the backend has no estimate for this leg yet. */
  minutes: number | null;
  distanceKm: number;
}

/**
 * Time and distance to the driver's next stop, only while they are moving towards it.
 * Minutes come from the backend; distance comes from the road path on the map, which updates
 * with every position. With several stops that path runs to the final drop, so the backend's
 * distance to the next stop is used instead.
 *
 * The backend refreshes its estimate about every 45 s. Between refreshes its pace is applied to the
 * live distance, so the minutes fall as the driver moves instead of sitting still.
 */
function buildLiveEta(order: Order, live: DriverLocation | null): LiveEta | null {
  const isToPickup = order.status === 'heading_to_pickup';
  if (!live || (!isToPickup && order.status !== 'pickup_complete')) return null;
  // Right after pickup the cached estimate can still be for the previous leg.
  const eta = order.liveEta?.toPickup === isToPickup ? order.liveEta : null;
  const toMinutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
  const isMultiStop = !isToPickup && order.stops.length > 1;
  if (isMultiStop) {
    return eta ? { minutes: toMinutes(eta.seconds), distanceKm: eta.meters / 1000 } : null;
  }
  const distance = pathDistanceKm(live.path);
  if (!eta) return { minutes: null, distanceKm: distance };
  const secondsPerKm = eta.meters > 0 ? eta.seconds / (eta.meters / 1000) : null;
  return {
    minutes: toMinutes(secondsPerKm !== null ? secondsPerKm * distance : eta.seconds),
    distanceKm: distance,
  };
}

const COUNTDOWN_TICK_MS = 10_000;
/** A driver this far from the drawn road path has taken another road: re-route. */
const REROUTE_AFTER_KM = 0.3;
/** Within this distance of the road the vehicle is drawn on it, like map-matched GPS. */
const SNAP_TO_ROAD_KM = 0.06;
/** Each Routes call is billed: re-route a driver who left the road at most this often, this many times per leg. */
const REROUTE_COOLDOWN_MS = 60_000;
const MAX_REROUTES_PER_LEG = 3;

/**
 * Road-following route for the order, plus the driver's current leg built from
 * the polled position: the road path still ahead of the driver.
 */
function useRoadTracking(order: Order | undefined, pushedDriver: GeoPoint | null) {
  const status = order?.status;
  const pickup = order?.route[0] ?? null;
  const drop = order ? order.route[order.route.length - 1] : null;
  // The socket's position is fresher than the polled one.
  const driver = pushedDriver ?? order?.driverLocation ?? null;
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

  const baseRoute = leg === 'to_pickup' ? approach.data : planned.data;
  // The vehicle only moves forward along a route: remember how far it got on the current path so
  // GPS jitter or a parallel road cannot throw it back or onto another part of the line.
  const [progress, setProgress] = useState<{ route: GeoPoint[] | null; index: number }>({
    route: null,
    index: 0,
  });
  const progressOn = (route: GeoPoint[] | undefined) =>
    route && progress.route === route ? progress.index : 0;
  const baseAhead =
    leg && driver && baseRoute ? remainingPath(baseRoute, driver, progressOn(baseRoute)) : null;
  // A driver who left the planned trip road gets a fresh road path from where they are to the drop.
  const needsDetour = leg === 'to_drop' && (baseAhead?.offPathKm ?? 0) > REROUTE_AFTER_KM;
  const detour = useRoadRoute(`${order?.id}:detour`, needsDetour ? driver : null, drop);
  const legRoute = leg === 'to_drop' && detour.data ? detour.data : baseRoute;
  const ahead =
    leg && driver && legRoute ? remainingPath(legRoute, driver, progressOn(legRoute)) : null;
  if (ahead && legRoute && (progress.route !== legRoute || ahead.index > progress.index)) {
    setProgress({ route: legRoute, index: ahead.index });
  }

  // Re-routing costs a Routes API call, so it is rate limited: at most a few per leg, spaced out.
  const offPath = (ahead?.offPathKm ?? 0) > REROUTE_AFTER_KM;
  const { refetch, isFetching } = approach;
  const { refetch: refetchDetour, isFetching: isFetchingDetour } = detour;
  const reroutes = useRef({ at: 0, count: 0 });
  useEffect(() => {
    reroutes.current = { at: 0, count: 0 };
  }, [leg, order?.id]);
  const driverLat = driver?.latitude;
  const driverLng = driver?.longitude;
  useEffect(() => {
    if (!offPath) return;
    const state = reroutes.current;
    const now = Date.now();
    if (now - state.at < REROUTE_COOLDOWN_MS || state.count >= MAX_REROUTES_PER_LEG) return;
    // The pickup approach and the drop leg are each re-routed from the driver; the planned trip stays pickup → drop.
    if (leg === 'to_pickup' && !isFetching) {
      state.at = now;
      state.count += 1;
      void refetch();
    } else if (leg === 'to_drop' && needsDetour && !isFetchingDetour) {
      state.at = now;
      state.count += 1;
      void refetchDetour();
    }
    // Re-checked on every position so the cooldown can lapse while the driver stays off the road.
  }, [
    leg,
    offPath,
    needsDetour,
    isFetching,
    isFetchingDetour,
    refetch,
    refetchDetour,
    driverLat,
    driverLng,
  ]);

  const onRoad = ahead !== null && ahead.offPathKm <= SNAP_TO_ROAD_KM;
  const live: DriverLocation | null =
    leg && driver
      ? {
          location: onRoad ? ahead.snapped : driver,
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

  const pushedDriver = useLiveTracking(order?.tripId && isLive ? order.tripId : null, () => {
    // A status push means the order changed server-side: refetch it (and the list).
    if (!orderId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true });
  });
  const now = useNow(COUNTDOWN_TICK_MS);
  const road = useRoadTracking(order, pushedDriver);

  const minutesUntilDriver = order?.driverAssignAt
    ? Math.max(0, Math.ceil((Date.parse(order.driverAssignAt) - now) / 60_000))
    : 0;

  return {
    orderQuery,
    order,
    minutesUntilDriver,
    map: order ? buildTrackingMap(order.status, road.route, road.live) : null,
    liveEta: order ? buildLiveEta(order, road.live) : null,
  };
}
