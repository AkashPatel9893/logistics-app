import { useEffect, useRef, useState } from 'react';

import { DROP_PIN_COLOR, MapPin as PinShape, PICKUP_PIN_COLOR } from '@/components/map-pin';
import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppPressable,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  type AppMapCameraRef,
} from '@/components/ui';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeBounds, type GeoPoint } from '@/lib/geo';
import { useWindowDimensions } from '@/lib/native';
import { goBack, useIsFocused, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useAppRules, useRoadRoute } from '@/queries';
import { draftStops, useAuthStore, useTripStore, type DraftStop } from '@/stores';

import { FloatingStopsCard, StopBadge } from './components/floating-stops-card';

const BOUNDS_MARGIN_DEG = 0.0015;
const ROUTE_REQUEST_DEBOUNCE_MS = 600;

function isComplete(stop: DraftStop): boolean {
  return stop.region !== null && stop.details !== null;
}

function MapPin({ kind, number }: { kind: 'pickup' | 'stop' | 'final'; number?: number }) {
  if (kind === 'pickup') return <PinShape color={PICKUP_PIN_COLOR} arrow="up" />;
  if (kind === 'final') return <PinShape color={DROP_PIN_COLOR} arrow="down" />;
  return (
    <AppView className="rounded-full border-2 border-white">
      <StopBadge kind={kind} number={number} />
    </AppView>
  );
}

export function AddStopsScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: 'add' | 'edit' }>();
  const maxDrops = useAppRules().maxOrderStops - 1;
  const draft = useTripStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const stops = draftStops(draft);

  const hasPrepared = useRef(false);
  useEffect(() => {
    if (hasPrepared.current) return;
    hasPrepared.current = true;
    const trip = useTripStore.getState();
    const count = draftStops(trip.draft).length;
    if (mode === 'add' ? count < maxDrops : mode !== 'edit' && count < 2) trip.addStop();
  }, [mode, maxDrops]);

  useEffect(
    () => () => {
      const trip = useTripStore.getState();
      let remaining = draftStops(trip.draft);
      for (let index = remaining.length - 1; index >= 0 && remaining.length > 1; index--) {
        if (remaining[index].region) continue;
        trip.removeStop(index);
        remaining = draftStops(useTripStore.getState().draft);
      }
    },
    [],
  );

  const pickupContact = [
    draft.pickupDetails?.contactName ?? user?.name,
    draft.pickupDetails?.contactPhone ?? user?.phone,
  ]
    .filter(Boolean)
    .join(' · ');
  const points: { point: GeoPoint; kind: 'pickup' | 'stop' | 'final'; number?: number }[] = [
    ...(draft.pickupRegion ? [{ point: draft.pickupRegion, kind: 'pickup' as const }] : []),
    ...stops.flatMap((stop, index) =>
      stop.region ? [{ point: stop.region, kind: 'stop' as const, number: index + 1 }] : [],
    ),
  ];
  const lastPoint = points.at(-1);
  if (lastPoint && lastPoint.kind === 'stop') lastPoint.kind = 'final';
  const canConfirm = stops.length > 0 && stops.every(isComplete);

  const routeColor = useThemeColor('brand');
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
    points.length > 0
      ? computeBounds([...points.map((p) => p.point), ...(line ?? [])], BOUNDS_MARGIN_DEG)
      : undefined;

  const filledDrops = stops.filter((stop) => stop.region).length;

  const { height: windowHeight } = useWindowDimensions();
  const [topOverlay, setTopOverlay] = useState(0);
  const [bottomOverlay, setBottomOverlay] = useState(0);
  const mapPadding = {
    top: topOverlay + 56,
    bottom: bottomOverlay + 28,
    left: 48,
    right: 48,
  };
  const listMaxHeight = Math.round(windowHeight * 0.34);

  const cameraRef = useRef<AppMapCameraRef>(null);
  const pointsKey = `${points.map((p) => `${p.point.latitude},${p.point.longitude}`).join('|')}:${road.data?.length ?? 0}`;
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

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar style="dark" />

      <AppMapView className="absolute inset-0">
        {bounds ? (
          <AppMapCamera ref={cameraRef} initialViewState={{ bounds, padding: mapPadding }} />
        ) : null}
        {line ? (
          <AppMapPolyline
            key={`route:${pointsKey}:${isRoadLine ? 'road' : 'straight'}`}
            coordinates={line}
            strokeColor={routeColor}
            strokeWidth={isRoadLine ? 5 : 3}
            dashed={!isRoadLine}
          />
        ) : null}
        {points.map((p) => (
          <AppMapMarker
            key={`${p.kind}:${p.number ?? 0}`}
            coordinate={p.point}
            tracksViewChanges={trackMarkers}
          >
            <MapPin kind={p.kind} number={p.number} />
          </AppMapMarker>
        ))}
      </AppMapView>

      <FloatingStopsCard
        mode={mode}
        draft={draft}
        stops={stops}
        maxDrops={maxDrops}
        pickupContact={pickupContact}
        listMaxHeight={listMaxHeight}
        onLayoutHeight={setTopOverlay}
        onBack={() => goBack(router)}
        onPressPickup={() =>
          router.push({ pathname: '/location-select', params: { target: 'pickup' } })
        }
        onPressStop={(index) =>
          router.push({ pathname: '/location-select', params: { stop: String(index) } })
        }
        onMoveStop={(from, to) => useTripStore.getState().moveStop(from, to)}
        onRemoveStop={(index) => useTripStore.getState().removeStop(index)}
        onAddStop={() => useTripStore.getState().addStop()}
      />

      {bounds ? (
        <AppPressable
          onPress={fitMap}
          accessibilityRole="button"
          accessibilityLabel="Show the whole route"
          className="absolute right-4 size-11 items-center justify-center rounded-full bg-surface shadow-floating"
          style={{ bottom: bottomOverlay + 12 }}
        >
          <Icon name="scope" size={20} tone="foreground" />
        </AppPressable>
      ) : null}

      <AppView
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-surface px-4 pb-safe-offset-3 pt-4 shadow-sheet"
        onLayout={(event) => setBottomOverlay(Math.round(event.nativeEvent.layout.height))}
      >
        <AppView row className="mb-3.5 items-center px-1">
          <AppView center className="mr-3 size-10 rounded-2xl bg-brand-soft">
            <Icon name="box.truck.fill" size={18} tone="brand" />
          </AppView>
          <AppView className="flex-1">
            <AppText className="text-[15px] font-bold text-foreground">
              {filledDrops === 0
                ? 'Choose where it goes'
                : `Pickup + ${filledDrops} ${filledDrops === 1 ? 'drop' : 'drops'}`}
            </AppText>
            <AppText className="mt-0.5 text-[12px] text-muted">
              {canConfirm
                ? 'Stops are visited in this order'
                : 'Add receiver details for every stop'}
            </AppText>
          </AppView>
        </AppView>
        <Button
          label={canConfirm ? 'Select Vehicle' : 'Add details for every stop'}
          variant="primary"
          disabled={!canConfirm}
          onPress={() => (mode ? goBack(router) : router.push('/trip-confirmation'))}
          className="h-auto py-3.5"
          textClassName="text-[15px]"
        />
      </AppView>
    </AppView>
  );
}
