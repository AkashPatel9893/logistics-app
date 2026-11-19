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
} from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWindowDimensions } from '@/lib/native';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useAppRules } from '@/queries';
import { draftStops, useAuthStore, useTripStore } from '@/stores';

import { FloatingStopsCard } from './components/floating-stops-card';
import { StopBadge } from './components/stop-badge';
import { useDraftStopsLifecycle } from './hooks/use-draft-stops-lifecycle';
import { useStopsRouteMap } from './hooks/use-stops-route-map';

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

  useDraftStopsLifecycle(mode, maxDrops);

  const canConfirm =
    stops.length > 0 && stops.every((s) => s.region !== null && s.details !== null);
  const {
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
  } = useStopsRouteMap(draft.pickupRegion, stops, canConfirm);
  const routeColor = useThemeColor('brand');
  const { height: windowHeight } = useWindowDimensions();

  const pickupContact = [
    draft.pickupDetails?.contactName ?? user?.name,
    draft.pickupDetails?.contactPhone ?? user?.phone,
  ]
    .filter(Boolean)
    .join(' · ');
  const filledDrops = stops.filter((stop) => stop.region).length;

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
        listMaxHeight={Math.round(windowHeight * 0.34)}
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
