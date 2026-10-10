import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
  type OlaMapCameraRef,
} from '@/components/ui/ola-map-view';
import { cn } from '@/lib/cn';
import { useRoadRoute } from '@/hooks/use-road-route';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeBounds, type GeoPoint } from '@/lib/geo';
import { draftStops, useTripStore, type DraftStop } from '@/stores/trip-store';

import { StopConnector } from './components/stop-connector';

/** The backend prices any number of stops; this keeps a booking practical for one driver. */
const MAX_STOPS = 5;
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
  return (
    <AppView className="rounded-full border-2 border-white">
      <StopBadge kind={kind} number={number} />
    </AppView>
  );
}

/** Multi-stop booking: the pickup, then every delivery stop in visiting order. */
export function AddStopsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draft = useTripStore.use.draft();
  const stops = draftStops(draft);

  // Opening this screen means "more than one stop": start with a second, empty one.
  useEffect(() => {
    if (draftStops(useTripStore.getState().draft).length < 2) useTripStore.getState().addStop();
  }, []);

  const pickupContact = [draft.pickupDetails?.contactName, draft.pickupDetails?.contactPhone]
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
  const cameraRef = useRef<OlaMapCameraRef>(null);
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
      <ScreenHeader title="Add Stops" onBack={() => router.back()} />

      <AppScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <AppView className="rounded-2xl border border-border/40 bg-surface p-4 shadow-xs">
          <AppView className="flex-row items-center gap-3">
            <StopBadge kind="pickup" />
            <AppView className="flex-1 rounded-xl bg-surface-muted px-3.5 py-3">
              {pickupContact ? (
                <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                  {pickupContact}
                </AppText>
              ) : null}
              <AppText numberOfLines={1} className="text-[13px] text-muted">
                {draft.pickupLabel || 'Pickup location'}
              </AppText>
            </AppView>
          </AppView>

          {stops.map((stop, index) => {
            const isFinal = index === stops.length - 1;
            const contact = [stop.details?.contactName, stop.details?.contactPhone]
              .filter(Boolean)
              .join(' · ');
            return (
              <AppView key={index}>
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
                      'flex-1 rounded-xl border px-3.5 py-3',
                      stop.region && !stop.details ? 'border-amber-500' : 'border-border',
                    )}
                  >
                    {stop.label ? (
                      <>
                        <AppText
                          numberOfLines={1}
                          className="text-[14px] font-bold text-foreground"
                        >
                          {contact || 'Add receiver details'}
                        </AppText>
                        <AppText numberOfLines={1} className="text-[13px] text-muted">
                          {[stop.label, stop.address].filter(Boolean).join(', ')}
                        </AppText>
                      </>
                    ) : (
                      <AppText className="py-1 text-[14px] font-medium text-subtle">
                        Where is your Stop {index + 1}?
                      </AppText>
                    )}
                  </AppPressable>
                  <AppPressable
                    onPress={() => useTripStore.getState().removeStop(index)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove stop ${index + 1}`}
                  >
                    <Icon name="xmark.circle.fill" size={20} tone="icon-faint" />
                  </AppPressable>
                </AppView>
              </AppView>
            );
          })}

          {stops.length < MAX_STOPS ? (
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
              You can add up to {MAX_STOPS} stops.
            </AppText>
          )}
        </AppView>

        <AppView className="mt-4 h-[300px] overflow-hidden rounded-2xl border border-border/40">
          <OlaMapView style={{ flex: 1 }}>
            {bounds ? (
              <OlaMapCamera ref={cameraRef} initialViewState={{ bounds, padding: MAP_PADDING }} />
            ) : null}
            {line ? (
              <OlaMapPolyline coordinates={line} strokeColor={routeColor} strokeWidth={4} />
            ) : null}
            {points.map((p) => (
              <OlaMapMarker key={`${p.kind}:${p.number ?? 0}`} coordinate={p.point}>
                <MapPin kind={p.kind} number={p.number} />
              </OlaMapMarker>
            ))}
          </OlaMapView>
        </AppView>
      </AppScrollView>

      <AppView className="px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button
          label={canConfirm ? 'Select Vehicle' : 'Add details for every stop'}
          variant="primary"
          disabled={!canConfirm}
          onPress={() => router.push('/trip-confirmation')}
          className="h-auto py-3.5"
          textClassName="text-[15px]"
        />
      </AppView>
    </AppView>
  );
}
