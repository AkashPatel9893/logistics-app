import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppView,
  Icon,
} from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { computeBounds, type GeoPoint } from '@/lib/geo';

function RouteMarker() {
  return (
    <AppView center className="size-8 rounded-full border-2 border-white bg-promo">
      <Icon name="shippingbox.fill" size={14} tone="brand-foreground" />
    </AppView>
  );
}

export interface RoutePreviewMapProps {
  route: GeoPoint[];
  /** Extra top padding so markers clear the floating header. */
  topInset: number;
}

export function RoutePreviewMap({ route, topInset }: RoutePreviewMapProps) {
  const routeColor = useThemeColor('brand');

  return (
    <AppMapView style={{ flex: 1 }}>
      <AppMapCamera
        initialViewState={{
          bounds: computeBounds(route),
          padding: { top: topInset + 70, left: 50, right: 50, bottom: 40 },
        }}
      />
      <AppMapPolyline coordinates={route} strokeColor={routeColor} strokeWidth={4} />
      {/* Pickup, every stop, and the final drop. */}
      {route.map((point, index) => (
        <AppMapMarker key={`${index}:${point.latitude},${point.longitude}`} coordinate={point}>
          <RouteMarker />
        </AppMapMarker>
      ))}
    </AppMapView>
  );
}
