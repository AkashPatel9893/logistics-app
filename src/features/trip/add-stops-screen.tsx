import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  type AppMapCameraRef,
  Button,
  FocusAwareStatusBar,
  Icon,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/cn';
import { useAppRules } from '@/hooks/use-catalog';
import { useRoadRoute } from '@/hooks/use-road-route';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeBounds, type GeoPoint } from '@/lib/geo';
import { draftStops, useTripStore, type DraftStop } from '@/stores/trip-store';

import { DraggableStopRow } from './components/draggable-stop-row';
import { StopConnector } from './components/stop-connector';
import { placeLine } from './place-line';
import { goBack } from '@/lib/go-back';
import { DROP_PIN_COLOR, MapPin as PinShape, PICKUP_PIN_COLOR } from '@/components/map-pin';

/** Tight fit around the stops; the pixel padding above gives the breathing room. */
const BOUNDS_MARGIN_DEG = 0.0015;

function isComplete(stop: DraftStop): boolean {
  return stop.region !== null && stop.details !== null;
}

function StopBadge({ kind, number }: { kind: 'pickup' | 'stop' | 'final'; number?: number }) {
  if (kind === 'stop') {
    return (
      <AppView center className="size-7 rounded-full bg-slate-600">
        <AppText className="text-[12px] font-bold text-white">{number}</AppText>
      </AppView>
    );
  }
  // Green circle with an up arrow for pickup, red circle with a down arrow for the final drop.
  return (
    <AppView
      center
      className={cn('size-7 rounded-full', kind === 'pickup' ? 'bg-emerald-500' : 'bg-rose-500')}
    >
      <Icon name={kind === 'pickup' ? 'arrow.up' : 'arrow.down'} size={14} color="#FFFFFF" />
    </AppView>
  );
}

function MapPin({ kind, number }: { kind: 'pickup' | 'stop' | 'final'; number?: number }) {
  // Pickup and the final drop are teardrop pins with an arrow; middle stops are numbered badges.
  if (kind === 'pickup') return <PinShape color={PICKUP_PIN_COLOR} arrow="up" />;
  if (kind === 'final') return <PinShape color={DROP_PIN_COLOR} arrow="down" />;
  return (
    <AppView className="rounded-full border-2 border-white">
      <StopBadge kind={kind} number={number} />
    </AppView>
  );
}

/**
 * Multi-stop booking: the pickup, then every delivery stop in visiting order.
 * `mode`: `add` (vehicle screen's Add Stop) appends an empty stop, `edit` (Edit Locations) changes
 * the trip as it is; with no mode (the search screen's +) the trip starts with two stops.
 */
export function AddStopsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: 'add' | 'edit' }>();
  // The server's stop limit counts the pickup too, so drops allowed = limit - 1.
  const maxDrops = useAppRules().maxOrderStops - 1;
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();
  const stops = draftStops(draft);
  const dragIndex = useSharedValue(-1);
  const dragOffset = useSharedValue(0);

  const hasPrepared = useRef(false);
  useEffect(() => {
    if (hasPrepared.current) return;
    hasPrepared.current = true;
    const trip = useTripStore.getState();
    const count = draftStops(trip.draft).length;
    if (mode === 'add' ? count < maxDrops : mode !== 'edit' && count < 2) trip.addStop();
  }, [mode, maxDrops]);

  // Leaving without filling a stop drops it, so the trip behind this screen is never left with
  // a blank destination. The last stop stays: it is the drop the search screen fills in.
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
  // Like Porter, the last stop chosen so far is where the route ends, so it gets the drop pin.
  const lastPoint = points.at(-1);
  if (lastPoint && lastPoint.kind === 'stop') lastPoint.kind = 'final';
  const canConfirm = stops.length > 0 && stops.every(isComplete);

  // Road line through the chosen stops, in visiting order.
  const routeColor = useThemeColor('brand');
  const located = points.map((p) => p.point);
  const road = useRoadRoute(
    `stops:${located.map((p) => `${p.latitude},${p.longitude}`).join('|')}`,
    located.length >= 2 ? located[0] : null,
    located.length >= 2 ? located[located.length - 1] : null,
    located.slice(1, -1),
  );
  // Until the road shape arrives (or if it can't be fetched) a dashed straight line joins the stops,
  // so it never reads as the real route.
  const line = road.data ?? (located.length >= 2 ? located : null);
  const isRoadLine = Boolean(road.data);
  // Fit the whole road line, not only the pins: a route can loop out past its stops.
  const bounds =
    points.length > 0
      ? computeBounds([...points.map((p) => p.point), ...(line ?? [])], BOUNDS_MARGIN_DEG)
      : undefined;

  const filledDrops = stops.filter((stop) => stop.region).length;

  // The map runs under the floating stops card and the bottom sheet; both are measured so the
  // route is always fitted into the visible gap between them.
  const { height: windowHeight } = useWindowDimensions();
  const [topOverlay, setTopOverlay] = useState(0);
  const [bottomOverlay, setBottomOverlay] = useState(0);
  const mapPadding = useMemo(
    () => ({
      // Pins stand above their point, so the top needs extra room.
      top: topOverlay + 56,
      bottom: bottomOverlay + 28,
      left: 48,
      right: 48,
    }),
    [topOverlay, bottomOverlay],
  );
  // With the most stops the list would push the map off screen, so past this it scrolls inside.
  const listMaxHeight = Math.round(windowHeight * 0.34);

  const cameraRef = useRef<AppMapCameraRef>(null);
  // Re-fit when a stop changes, once the road shape for it arrives, and when an overlay resizes.
  const pointsKey = `${points.map((p) => `${p.point.latitude},${p.point.longitude}`).join('|')}:${road.data?.length ?? 0}`;
  const fitKey = `${pointsKey}:${topOverlay}:${bottomOverlay}`;
  // Android draws a custom marker once into an image; a marker re-made for a changed stop can be
  // captured before its badge draws (a blank ring). Let markers redraw briefly after each change.
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
  const fitMap = useCallback(() => {
    const latest = fitRef.current;
    if (!latest.bounds) return;
    cameraRef.current
      ?.setStop({ bounds: latest.bounds, padding: latest.mapPadding, duration: 300 })
      .catch(() => {});
  }, []);
  useEffect(fitMap, [fitKey, fitMap]);
  // Stops are picked on screens stacked above this one; a fit asked for while the map is covered
  // is dropped on Android, so fit again each time this screen is back in view.
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(fitMap, 250);
      return () => clearTimeout(timer);
    }, [fitMap]),
  );

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar style="dark" />

      <AppMapView style={StyleSheet.absoluteFill}>
        {bounds ? (
          <AppMapCamera ref={cameraRef} initialViewState={{ bounds, padding: mapPadding }} />
        ) : null}
        {line ? (
          <AppMapPolyline
            // Keyed on the route: an Android line changed while this screen is covered keeps
            // its old shape, so a new route mounts a fresh line instead.
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

      {/* Floating stops card over the map. */}
      <AppView
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 px-3"
        style={{ paddingTop: insets.top + 8 }}
        onLayout={(event) => setTopOverlay(Math.round(event.nativeEvent.layout.height))}
      >
        <AppView className="rounded-[28px] bg-surface" style={styles.floatingShadow}>
          <AppView row className="items-center px-3 pb-2 pt-3">
            <AppPressable
              onPress={() => goBack(router)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={6}
              className="size-10 items-center justify-center rounded-full bg-surface-muted"
            >
              <Icon name="chevron.left" size={20} tone="foreground" weight="semibold" />
            </AppPressable>
            <AppView className="ml-3 flex-1">
              <AppText accessibilityRole="header" className="text-[18px] font-bold text-foreground">
                {mode === 'edit' ? 'Edit Locations' : 'Add Stops'}
              </AppText>
              <AppText className="text-[12px] text-muted">
                {stops.length > 1 ? 'Hold ≡ and drag to change the order' : 'Pickup and drop'}
              </AppText>
            </AppView>
            <AppView className="rounded-full bg-brand-soft px-2.5 py-1">
              <AppText className="text-[11.5px] font-bold text-brand-strong">
                {stops.length}/{maxDrops} drops
              </AppText>
            </AppView>
          </AppView>

          <AppScrollView
            style={{ maxHeight: listMaxHeight }}
            contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces={false}
          >
            <AppView className="flex-row items-center gap-3">
              <StopBadge kind="pickup" />
              <AppPressable
                onPress={() =>
                  router.push({ pathname: '/location-select', params: { target: 'pickup' } })
                }
                accessibilityRole="button"
                accessibilityLabel={`Pickup: ${draft.pickupLabel || 'not set'}. Tap to change.`}
                className="h-[60px] flex-1 justify-center rounded-2xl bg-surface-muted px-3.5"
              >
                {pickupContact ? (
                  <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                    {pickupContact}
                  </AppText>
                ) : null}
                <AppText numberOfLines={1} className="text-[13px] text-muted">
                  {placeLine(draft.pickupLabel, draft.pickupAddress) || 'Pickup location'}
                </AppText>
              </AppPressable>
              {/* Lines the pickup up with the stops, whose right edge holds the drag handle. */}
              {stops.length > 1 ? <AppView className="w-9" /> : null}
            </AppView>

            {stops.map((stop, index) => {
              const isFinal = index === stops.length - 1;
              const contact = [stop.details?.contactName, stop.details?.contactPhone]
                .filter(Boolean)
                .join(' · ');
              return (
                <DraggableStopRow
                  key={`${index}:${stop.label}`}
                  index={index}
                  count={stops.length}
                  dragIndex={dragIndex}
                  dragOffset={dragOffset}
                  onMove={(from, to) => useTripStore.getState().moveStop(from, to)}
                  accessibilityLabel={`Reorder stop ${index + 1}`}
                >
                  <StopConnector className="ml-[13px]" />
                  <AppView className="flex-row items-center gap-3">
                    <StopBadge kind={isFinal ? 'final' : 'stop'} number={index + 1} />
                    <AppPressable
                      onPress={() =>
                        router.push({
                          pathname: '/location-select',
                          params: { stop: String(index) },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        stop.label
                          ? `Stop ${index + 1}: ${stop.label}. Tap to change.`
                          : `Choose stop ${index + 1}`
                      }
                      className={cn(
                        'h-[60px] flex-1 flex-row items-center rounded-2xl bg-surface-muted pl-3.5',
                        // Chosen but missing receiver details: outlined so it stands out.
                        stop.region && !stop.details && 'border border-amber-500',
                      )}
                    >
                      <AppView className="flex-1">
                        {stop.label ? (
                          <>
                            <AppText
                              numberOfLines={1}
                              className="text-[14px] font-bold text-foreground"
                            >
                              {contact || 'Add receiver details'}
                            </AppText>
                            <AppText numberOfLines={1} className="text-[13px] text-muted">
                              {placeLine(stop.label, stop.address)}
                            </AppText>
                          </>
                        ) : (
                          <AppText className="text-[14px] font-medium text-subtle">
                            {isFinal
                              ? 'Where is your Final Destination?'
                              : `Where is your Stop ${index + 1}?`}
                          </AppText>
                        )}
                      </AppView>
                      {stops.length > 1 ? (
                        <AppPressable
                          onPress={() => useTripStore.getState().removeStop(index)}
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove stop ${index + 1}`}
                          className="h-full justify-center px-3"
                        >
                          <Icon name="xmark.circle.fill" size={18} tone="icon-faint" />
                        </AppPressable>
                      ) : null}
                    </AppPressable>
                  </AppView>
                </DraggableStopRow>
              );
            })}
          </AppScrollView>

          <AppView className="mx-4 h-px bg-divider" />
          {stops.length < maxDrops ? (
            <AppPressable
              onPress={() => useTripStore.getState().addStop()}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 py-3.5"
            >
              <Icon name="plus.circle.fill" size={18} tone="brand" />
              <AppText className="text-[14px] font-bold text-brand">Add Stop</AppText>
            </AppPressable>
          ) : (
            <AppText className="py-3.5 text-center text-[12px] text-subtle">
              That&apos;s the most stops for one trip ({maxDrops}).
            </AppText>
          )}
        </AppView>
      </AppView>

      {/* Bring the whole route back into view after panning around. */}
      {bounds ? (
        <AppPressable
          onPress={fitMap}
          accessibilityRole="button"
          accessibilityLabel="Show the whole route"
          className="absolute right-4 size-11 items-center justify-center rounded-full bg-surface"
          style={[styles.floatingShadow, { bottom: bottomOverlay + 12 }]}
        >
          <Icon name="scope" size={20} tone="foreground" />
        </AppPressable>
      ) : null}

      <AppView
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-surface px-4 pt-4"
        style={[styles.sheetShadow, { paddingBottom: insets.bottom + 12 }]}
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
          // Opened from the vehicle screen: go back to it rather than stacking a second one.
          onPress={() => (mode ? goBack(router) : router.push('/trip-confirmation'))}
          className="h-auto py-3.5"
          textClassName="text-[15px]"
        />
      </AppView>
    </AppView>
  );
}

// Native shadow values for the overlays floating on the map.
const styles = StyleSheet.create({
  floatingShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
});
