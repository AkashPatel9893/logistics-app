/**
 * OlaMapView — renders Ola Maps vector tiles via MapLibre Native, with no
 * dependency on the Google Maps SDK or Apple MapKit.
 *
 * Usage:
 *   import { OlaMapView, OlaMapCamera, OlaMapMarker, OlaMapPolyline } from '@/components/ui/ola-map-view';
 *
 *   <OlaMapView ref={mapRef} style={{ flex: 1 }}>
 *     <OlaMapCamera centerCoordinate={{ latitude, longitude }} zoomLevel={15} />
 *     <OlaMapMarker coordinate={{ latitude, longitude }}>{...}</OlaMapMarker>
 *     <OlaMapPolyline coordinates={[...]} strokeColor={useThemeColor('brand')} strokeWidth={4} />
 *   </OlaMapView>
 *
 * API key is read from EXPO_PUBLIC_OLA_MAPS_API_KEY in .env and is injected
 * into every request MapLibre makes to olamaps.io (style, tiles, sprites,
 * glyphs) — the style.json itself does not embed the key in those sub-urls.
 */
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type MapRef,
  Marker,
  TransformRequestManager,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { useEffect, useId, useMemo, type ComponentPropsWithRef, type ReactElement } from 'react';

const OLA_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY ?? '';
const OLA_STYLE_URL =
  'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';

let requestTransformConfigured = false;

function ensureOlaRequestTransform() {
  if (requestTransformConfigured || !OLA_API_KEY) return;
  TransformRequestManager.addUrlSearchParam({
    id: 'ola-maps-api-key',
    match: 'olamaps.io',
    name: 'api_key',
    value: OLA_API_KEY,
  });
  requestTransformConfigured = true;
}

export type OlaMapViewProps = Omit<ComponentPropsWithRef<typeof MapLibreMap>, 'mapStyle'>;

export function OlaMapView({ style, ...props }: OlaMapViewProps) {
  useEffect(() => {
    ensureOlaRequestTransform();
  }, []);

  return (
    <MapLibreMap mapStyle={OLA_STYLE_URL} style={[{ overflow: 'hidden' }, style]} {...props} />
  );
}

export { Camera as OlaMapCamera, UserLocation as OlaMapUserLocation };
export type { CameraRef as OlaMapCameraRef, MapRef as OlaMapViewRef };

// ─── Marker ────────────────────────────────────────────────────────────────

export interface OlaMapCoordinate {
  latitude: number;
  longitude: number;
}

export interface OlaMapMarkerProps {
  coordinate: OlaMapCoordinate;
  anchor?: 'center' | 'bottom' | 'top' | 'left' | 'right';
  children: ReactElement;
}

export function OlaMapMarker({ coordinate, anchor = 'center', children }: OlaMapMarkerProps) {
  return (
    <Marker lngLat={[coordinate.longitude, coordinate.latitude]} anchor={anchor}>
      {children}
    </Marker>
  );
}

// ─── Polyline ──────────────────────────────────────────────────────────────

export interface OlaMapPolylineProps {
  coordinates: OlaMapCoordinate[];
  strokeColor: string;
  strokeWidth: number;
}

export function OlaMapPolyline({ coordinates, strokeColor, strokeWidth }: OlaMapPolylineProps) {
  const sourceId = useId();

  const geojson = useMemo<GeoJSON.Feature>(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map((c) => [c.longitude, c.latitude]),
      },
    }),
    [coordinates],
  );

  return (
    <GeoJSONSource id={sourceId} data={geojson}>
      <Layer
        id={`${sourceId}-line`}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': strokeColor, 'line-width': strokeWidth }}
      />
    </GeoJSONSource>
  );
}
