import { useEffect, useRef, useState } from 'react';

import type { AppMapCameraRef } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { computeBounds, type GeoPoint } from '@/lib/geo';
import { useIsFocused } from '@/lib/navigation';
import { useRoadRoute } from '@/queries';
import type { DraftStop } from '@/stores';

const BOUNDS_MARGIN_DEG = 0.0015;
const ROUTE_REQUEST_DEBOUNCE_MS = 600;

export interface RouteStopPoint {
  point: GeoPoint;
  kind: 'pickup' | 'stop' | 'final';
  number?: number;
}

export function useStopsRouteMap(
  pickupRegion: GeoPoint | null,
  stops: DraftStop[],
  canConfirm: boolean,
) {
  const points: RouteStopPoint[] = [
    ...(pickupRegion ? [{ point: pickupRegion, kind: 'pickup' as const }] : []),
    ...stops.flatMap((stop, index) =>
      stop.region ? [{ point: stop.region, kind: 'stop' as const, number: index + 1 }] : [],
    ),
  ];
  const lastPoint = points.at(-1);
  if (lastPoint && lastPoint.kind === 'stop') lastPoint.kind = 'final';

  const located = points.map((p) => p.point);
  const routeKey = located.map((p) => `${p.latitude},${p.longitude}`).join('|');
  const settledRouteKey = useDebouncedValue(canConfirm ? routeKey : '', ROUTE_REQUEST_DEBOUNCE_MS);
  const routeReady = canConfirm && located.length >= 2 && settledRouteKey === routeKey;
  const road = useRoadRoute(
    `stops:${routeKey}`,
    routeReady ? located[0] : null,
    routeReady ? located[located.length - 1] : null,
    located.slice(1, -1),
  );
  const line = road.data ?? (located.length >= 2 ? located : null);
  const isRoadLine = Boolean(road.data);
  const bounds =
    points.length > 0 ? computeBounds([...located, ...(line ?? [])], BOUNDS_MARGIN_DEG) : undefined;

  const [topOverlay, setTopOverlay] = useState(0);
  const [bottomOverlay, setBottomOverlay] = useState(0);
  const mapPadding = {
    top: topOverlay + 56,
    bottom: bottomOverlay + 28,
    left: 48,
    right: 48,
  };

  const cameraRef = useRef<AppMapCameraRef>(null);
  const pointsKey = `${routeKey}:${road.data?.length ?? 0}`;
  const fitKey = `${pointsKey}:${topOverlay}:${bottomOverlay}`;
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const trackMarkers = settledKey !== pointsKey;

  useEffect(() => {
    const timer = setTimeout(() => setSettledKey(pointsKey), 800);
    return () => clearTimeout(timer);
  }, [pointsKey]);

  const fitRef = useRef({ bounds, mapPadding });
  useEffect(() => {
    fitRef.current = { bounds, mapPadding };
  });

  const fitMap = () => {
    const latest = fitRef.current;
    if (!latest.bounds) return;
    cameraRef.current
      ?.setStop({ bounds: latest.bounds, padding: latest.mapPadding, duration: 300 })
      .catch(() => {});
  };

  useEffect(fitMap, [fitKey]);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(fitMap, 250);
    return () => clearTimeout(timer);
  }, [isFocused]);

  return {
    cameraRef,
    points,
    pointsKey,
    line,
    isRoadLine,
    bounds,
    mapPadding,
    trackMarkers,
    bottomOverlay,
    setTopOverlay,
    setBottomOverlay,
    fitMap,
  };
}
