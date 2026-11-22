import type { DriverLocation, GeoPoint, Order, OrderStatus } from '@/lib/api/models';
import { computeBounds, headingAlongPath, pathDistanceKm, type GeoBounds } from '@/lib/geo';

export interface TrackingMapState {
  route: GeoPoint[];
  bounds: GeoBounds | undefined;
  endMarker: 'pickup' | 'drop';
  showEndMarker?: boolean;
  showStartMarker: boolean;
  driverPosition: GeoPoint | null;
  driverHeading: number | null;
  showRoute: boolean;
  routeMuted: boolean;
  arrived: boolean;
}

export interface LiveEta {
  minutes: number | null;
  distanceKm: number;
}

export function buildTrackingMap(
  status: OrderStatus,
  route: GeoPoint[],
  live: DriverLocation | null,
  arrivedDropIndex?: number,
): TrackingMapState | null {
  if (status === 'cancelled' || route.length < 2) return null;
  const pickup = route[0];

  if (status === 'arrived_at_pickup' || status === 'arrived_at_drop') {
    const isPickup = status === 'arrived_at_pickup';
    const stop = isPickup
      ? pickup
      : (route[(arrivedDropIndex ?? route.length - 2) + 1] ?? route[route.length - 1]);
    return {
      route: [stop],
      bounds: computeBounds([stop], 0.002),
      endMarker: isPickup ? 'pickup' : 'drop',
      showStartMarker: false,
      driverPosition: live?.location ?? null,
      driverHeading: live ? headingAlongPath(live.path) : null,
      showRoute: false,
      routeMuted: false,
      arrived: true,
    };
  }

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
      arrived: false,
    };
  }

  if (status === 'heading_to_pickup') {
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
      arrived: false,
    };
  }

  const isToDrop = status === 'pickup_complete';
  const remaining = isToDrop && live?.leg === 'to_drop' && live.path.length >= 2 ? live.path : null;
  const shown = remaining ?? route;

  return {
    route: shown,
    bounds: computeBounds(shown),
    endMarker: 'drop',
    showStartMarker: status === 'searching',
    driverPosition: isToDrop ? (live?.location ?? null) : null,
    driverHeading: isToDrop && live ? headingAlongPath(live.path) : null,
    showRoute: true,
    routeMuted: false,
    arrived: false,
  };
}

export function buildLiveEta(
  order: Order,
  live: DriverLocation | null,
  now: number,
): LiveEta | null {
  const isToPickup = order.status === 'heading_to_pickup';
  if (!live || (!isToPickup && order.status !== 'pickup_complete')) return null;

  const eta = order.liveEta?.toPickup === isToPickup ? order.liveEta : null;
  const toMinutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
  const isMultiStop = !isToPickup && order.stops.length > 1;
  if (isMultiStop) {
    if (!eta) return null;
    const elapsedSeconds = eta.computedAt ? Math.max(0, (now - eta.computedAt) / 1000) : 0;
    return {
      minutes: toMinutes(Math.max(0, eta.seconds - elapsedSeconds)),
      distanceKm: eta.meters / 1000,
    };
  }

  const distance = pathDistanceKm(live.path);
  if (!eta) return { minutes: null, distanceKm: distance };
  const secondsPerKm = eta.meters > 0 ? eta.seconds / (eta.meters / 1000) : null;
  return {
    minutes: toMinutes(secondsPerKm !== null ? secondsPerKm * distance : eta.seconds),
    distanceKm: distance,
  };
}
