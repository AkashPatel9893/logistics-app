import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
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
  ScreenHeader,
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

const MAP_PADDING = { top: 40, left: 40, right: 40, bottom: 40 };

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
      stop.region
        ? [
            {
              point: stop.region,
              kind: index === stops.length - 1 ? ('final' as const) : ('stop' as const),
              number: index + 1,
            },
          ]
        : [],
    ),
  ];
  const bounds = points.length > 0 ? computeBounds(points.map((p) => p.point)) : undefined;
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
  const line = road.data ?? (located.length >= 2 ? located : null);

  // Re-fit the map whenever a stop is added, changed or removed.
  const cameraRef = useRef<AppMapCameraRef>(null);
  const pointsKey = points.map((p) => `${p.point.latitude},${p.point.longitude}`).join('|');
  const boundsRef = useRef(bounds);
  useEffect(() => {
    boundsRef.current = bounds;
  });
  useEffect(() => {
    const latest = boundsRef.current;
    if (!latest) return;
    cameraRef.current
      ?.setStop({ bounds: latest, padding: MAP_PADDING, duration: 300 })
      .catch(() => {});
  }, [pointsKey]);

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader
        title={mode === 'edit' ? 'Edit Locations' : 'Add Stops'}
        onBack={() => goBack(router)}
      />

      <AppScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <AppView className="rounded-2xl border border-border/40 bg-surface p-4 shadow-xs">
          <AppView className="flex-row items-center gap-3">
            <StopBadge kind="pickup" />
            <AppPressable
              onPress={() =>
                router.push({ pathname: '/location-select', params: { target: 'pickup' } })
              }
              accessibilityRole="button"
              accessibilityLabel={`Pickup: ${draft.pickupLabel || 'not set'}. Tap to change.`}
              className="h-[60px] flex-1 justify-center rounded-xl border border-border px-3.5"
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
                      router.push({ pathname: '/location-select', params: { stop: String(index) } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      stop.label
                        ? `Stop ${index + 1}: ${stop.label}. Tap to change.`
                        : `Choose stop ${index + 1}`
                    }
                    className={cn(
                      'h-[60px] flex-1 flex-row items-center rounded-xl border pl-3.5',
                      stop.region && !stop.details ? 'border-amber-500' : 'border-border',
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

          {stops.length < maxDrops ? (
            <AppPressable
              onPress={() => useTripStore.getState().addStop()}
              accessibilityRole="button"
              className="mt-4 flex-row items-center justify-center gap-2 py-1"
            >
              <Icon name="plus.circle.fill" size={18} tone="brand" />
              <AppText className="text-[14px] font-bold text-brand">Add Stop</AppText>
            </AppPressable>
          ) : (
            <AppText className="mt-4 text-center text-[12px] text-subtle">
              You can add up to {maxDrops} stops.
            </AppText>
          )}
        </AppView>

        <AppView className="mt-4 h-[300px] overflow-hidden rounded-2xl border border-border/40">
          <AppMapView style={{ flex: 1 }}>
            {bounds ? (
              <AppMapCamera ref={cameraRef} initialViewState={{ bounds, padding: MAP_PADDING }} />
            ) : null}
            {line ? (
              <AppMapPolyline coordinates={line} strokeColor={routeColor} strokeWidth={4} />
            ) : null}
            {points.map((p) => (
              <AppMapMarker key={`${p.kind}:${p.number ?? 0}`} coordinate={p.point}>
                <MapPin kind={p.kind} number={p.number} />
              </AppMapMarker>
            ))}
          </AppMapView>
        </AppView>
      </AppScrollView>

      <AppView className="px-4" style={{ paddingBottom: insets.bottom + 16 }}>
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
