import { AppView, Icon } from '@/components/ui';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
} from '@/components/ui/ola-map-view';
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
    <OlaMapView style={{ flex: 1 }}>
      <OlaMapCamera
        initialViewState={{
          bounds: computeBounds(route),
          padding: { top: topInset + 70, left: 50, right: 50, bottom: 40 },
        }}
      />
      <OlaMapPolyline coordinates={route} strokeColor={routeColor} strokeWidth={4} />
      <OlaMapMarker coordinate={route[0]}>
        <RouteMarker />
      </OlaMapMarker>
      <OlaMapMarker coordinate={route[route.length - 1]}>
        <RouteMarker />
      </OlaMapMarker>
    </OlaMapView>
  );
}
