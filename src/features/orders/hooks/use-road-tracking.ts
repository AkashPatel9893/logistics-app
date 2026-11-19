import { useEffect, useRef, useState } from 'react';

import type { DriverLocation, GeoPoint, Order } from '@/lib/api/models';
import { remainingPath } from '@/lib/geo';
import { useRoadRoute } from '@/queries';

const REROUTE_AFTER_KM = 0.8;
const SNAP_TO_ROAD_KM = 0.06;
const REROUTE_COOLDOWN_MS = 120_000;
const MAX_REROUTES_PER_LEG = 1;

export function useRoadTracking(order: Order | undefined, pushedDriver: GeoPoint | null) {
  const status = order?.status;
  const pickup = order?.route[0] ?? null;
  const drop = order ? order.route[order.route.length - 1] : null;
  const driver = pushedDriver ?? order?.driverLocation ?? null;
  const leg =
    status === 'heading_to_pickup' || status === 'arrived_at_pickup'
      ? 'to_pickup'
      : status === 'pickup_complete' || status === 'arrived_at_drop'
        ? 'to_drop'
        : null;

  const planned = useRoadRoute(`${order?.id}:trip`, pickup, drop, order?.route.slice(1, -1));
  const approach = useRoadRoute(
    `${order?.id}:to-pickup`,
    leg === 'to_pickup' ? driver : null,
    pickup,
  );

  const baseRoute = leg === 'to_pickup' ? approach.data : planned.data;
  const [progress, setProgress] = useState<{ route: GeoPoint[] | null; index: number }>({
    route: null,
    index: 0,
  });
  const progressOn = (route: GeoPoint[] | undefined) =>
    route && progress.route === route ? progress.index : 0;
  const baseAhead =
    leg && driver && baseRoute ? remainingPath(baseRoute, driver, progressOn(baseRoute)) : null;

  const needsDetour = leg === 'to_drop' && (baseAhead?.offPathKm ?? 0) > REROUTE_AFTER_KM;
  const detour = useRoadRoute(`${order?.id}:detour`, needsDetour ? driver : null, drop);
  const legRoute = leg === 'to_drop' && detour.data ? detour.data : baseRoute;
  const ahead =
    leg && driver && legRoute ? remainingPath(legRoute, driver, progressOn(legRoute)) : null;
  if (ahead && legRoute && (progress.route !== legRoute || ahead.index > progress.index)) {
    setProgress({ route: legRoute, index: ahead.index });
  }

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
    if (leg === 'to_pickup' && !isFetching) {
      state.at = now;
      state.count += 1;
      void refetch();
    } else if (leg === 'to_drop' && needsDetour && !isFetchingDetour) {
      state.at = now;
      state.count += 1;
      void refetchDetour();
    }
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
          path: ahead?.path ?? [driver, leg === 'to_pickup' ? pickup! : drop!],
          updatedAt: new Date().toISOString(),
        }
      : null;

  return { route: planned.data ?? order?.route ?? [], live };
}
