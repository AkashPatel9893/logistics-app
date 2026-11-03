import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppText,
  AppView,
} from '@/components/ui';
import { DROP_PIN_COLOR, MapPin, PICKUP_PIN_COLOR } from '@/components/map-pin';
import { useRoadRoute } from '@/hooks/use-road-route';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeBounds, type GeoPoint } from '@/lib/geo';

/** Pickup and final drop are pins with arrows; stops in between are numbered. */
function RouteMarker({ index, last }: { index: number; last: number }) {
  if (index === 0) return <MapPin color={PICKUP_PIN_COLOR} arrow="up" />;
  if (index === last) return <MapPin color={DROP_PIN_COLOR} arrow="down" />;
  return (
    <AppView center className="size-7 rounded-full border-2 border-white bg-brand">
      <AppText className="text-[12px] font-bold text-brand-foreground">{index}</AppText>
    </AppView>
  );
}

export interface RoutePreviewMapProps {
  route: GeoPoint[];
  /** Extra top padding so markers clear the floating header. */
  topInset: number;
  /** Height of the sheet resting over the map: the route stays clear of it. */
  bottomInset: number;
}

export function RoutePreviewMap({ route, topInset, bottomInset }: RoutePreviewMapProps) {
  const routeColor = useThemeColor('brand');
  // Follow the roads rather than a straight line between the stops.
  const road = useRoadRoute(
    `confirm:${route.map((p) => `${p.latitude},${p.longitude}`).join('|')}`,
    route[0] ?? null,
    route[route.length - 1] ?? null,
    route.slice(1, -1),
  );
  const line = road.data ?? route;

  return (
    <AppMapView style={{ flex: 1 }}>
      <AppMapCamera
        initialViewState={{
          bounds: computeBounds(route),
          padding: { top: topInset + 70, left: 50, right: 50, bottom: bottomInset + 40 },
        }}
      />
      <AppMapPolyline coordinates={line} strokeColor={routeColor} strokeWidth={4} />
      {/* Pickup, every stop, and the final drop. */}
      {route.map((point, index) => (
        <AppMapMarker key={`${index}:${point.latitude},${point.longitude}`} coordinate={point}>
          <RouteMarker index={index} last={route.length - 1} />
        </AppMapMarker>
      ))}
    </AppMapView>
  );
}
