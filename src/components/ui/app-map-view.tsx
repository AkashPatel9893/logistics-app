/**
 * AppMapView: Google Maps on both iOS and Android (react-native-maps, PROVIDER_GOOGLE).
 *
 *   <AppMapView style={{ flex: 1 }}>
 *     <AppMapCamera bounds={bounds} padding={padding} />      // re-fits whenever bounds change
 *     <AppMapMarker coordinate={...}>{custom view}</AppMapMarker>
 *     <AppMapPolyline coordinates={[...]} strokeColor="#FF5A1F" strokeWidth={4} />
 *   </AppMapView>
 *
 * Children are declarative directives read by AppMapView; they render nothing themselves.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AppMapCoordinate {
  latitude: number;
  longitude: number;
}

export type GeoBounds = [west: number, south: number, east: number, north: number];

export interface CameraPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AppMapCameraRef {
  setCameraPosition: (config?: {
    coordinates?: AppMapCoordinate;
    zoom?: number;
    duration?: number;
  }) => Promise<void>;
  setStop: (options: {
    bounds: GeoBounds;
    padding?: CameraPadding;
    duration?: number;
  }) => Promise<void>;
  easeTo: (options: {
    center: [number, number]; // [longitude, latitude]
    zoom?: number;
    duration?: number;
    padding?: CameraPadding;
  }) => Promise<void>;
}

export type AppMapViewRef = AppMapCameraRef;

const DEFAULT_PADDING = 40;

// ─── Declarative children ──────────────────────────────────────────────────

export interface AppMapMarkerProps {
  coordinate: AppMapCoordinate;
  title?: string;
  snippet?: string;
  anchor?: 'center' | 'bottom' | 'top' | 'left' | 'right';
  /** Default pin colour when no custom children are given. */
  tintColor?: string;
  /** Kept for call-site compatibility; Google Maps draws `children` or a coloured pin instead. */
  systemImage?: string;
  /** Custom marker view. */
  children?: ReactNode;
}

export function AppMapMarker(_props: AppMapMarkerProps): ReactElement | null {
  return null;
}

export interface AppMapPolylineProps {
  coordinates: AppMapCoordinate[];
  strokeColor: string;
  strokeWidth: number;
}

export function AppMapPolyline(_props: AppMapPolylineProps): ReactElement | null {
  return null;
}

export interface AppMapCameraProps {
  centerCoordinate?: AppMapCoordinate;
  zoomLevel?: number;
  bounds?: GeoBounds;
  padding?: CameraPadding;
  initialViewState?: {
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    bounds?: GeoBounds;
    padding?: CameraPadding;
  };
}

// Camera props are read by AppMapView; the ref is accepted so existing call sites keep working.
export const AppMapCamera = forwardRef<AppMapCameraRef, AppMapCameraProps>(
  function AppMapCamera(_props, _ref) {
    return null;
  },
);

export function AppMapUserLocation(): ReactElement | null {
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Web-mercator zoom level that shows `lngDelta` degrees across the view. */
const zoomFromDelta = (lngDelta: number) => Math.log2(360 / Math.max(lngDelta, 1e-6));
const deltaFromZoom = (zoom: number) => 360 / 2 ** zoom;

/** The two opposite corners of a bounds box, as fit-to-coordinates input. */
function boundsCorners([west, south, east, north]: GeoBounds): AppMapCoordinate[] {
  return [
    { latitude: south, longitude: west },
    { latitude: north, longitude: east },
  ];
}

function boundsRegion([west, south, east, north]: GeoBounds): Region {
  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
    latitudeDelta: Math.max((north - south) * 1.4, 0.004),
    longitudeDelta: Math.max((east - west) * 1.4, 0.004),
  };
}

function toEdgePadding(padding?: CameraPadding) {
  return {
    top: padding?.top ?? DEFAULT_PADDING,
    right: padding?.right ?? DEFAULT_PADDING,
    bottom: padding?.bottom ?? DEFAULT_PADDING,
    left: padding?.left ?? DEFAULT_PADDING,
  };
}

// ─── Map view ──────────────────────────────────────────────────────────────

export interface AppMapViewProps extends ComponentPropsWithoutRef<typeof View> {
  style?: StyleProp<ViewStyle>;
  compass?: boolean;
  dragPan?: boolean;
  touchZoom?: boolean;
  touchRotate?: boolean;
  touchPitch?: boolean;
  onMapLoaded?: () => void;
  onDidFinishLoadingMap?: () => void;
  onRegionDidChange?: (event: { nativeEvent: { center: [number, number]; zoom: number } }) => void;
  onMapClick?: (event: { coordinates: AppMapCoordinate }) => void;
  children?: ReactNode;
}

export const AppMapView = forwardRef<AppMapViewRef, AppMapViewProps>(function AppMapView(
  {
    style,
    compass = true,
    dragPan = true,
    touchZoom = true,
    touchRotate = true,
    touchPitch = true,
    onMapLoaded,
    onDidFinishLoadingMap,
    onRegionDidChange,
    onMapClick,
    children,
    ...viewProps
  },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const readyRef = useRef(false);

  const parsed = useMemo(() => {
    const markers: AppMapMarkerProps[] = [];
    const polylines: AppMapPolylineProps[] = [];
    let camera: AppMapCameraProps | undefined;
    let userLocation = false;
    const overlay: ReactNode[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        if (child) overlay.push(child);
        return;
      }
      if (child.type === AppMapMarker) markers.push(child.props as AppMapMarkerProps);
      else if (child.type === AppMapPolyline) polylines.push(child.props as AppMapPolylineProps);
      else if (child.type === AppMapCamera) camera = child.props as AppMapCameraProps;
      else if (child.type === AppMapUserLocation) userLocation = true;
      else overlay.push(child);
    });
    return { markers, polylines, camera, userLocation, overlay };
  }, [children]);

  const bounds = parsed.camera?.bounds ?? parsed.camera?.initialViewState?.bounds;
  const padding = parsed.camera?.padding ?? parsed.camera?.initialViewState?.padding;
  const boundsKey = bounds ? bounds.map((n) => n.toFixed(3)).join(',') : '';

  const fit = useCallback((target: GeoBounds, pad?: CameraPadding, animated = true) => {
    mapRef.current?.fitToCoordinates(boundsCorners(target), {
      edgePadding: toEdgePadding(pad),
      animated,
    });
  }, []);

  // Re-fit whenever the route's bounds (or the padding) change: zoom in/out to keep the whole
  // route on screen.
  const paddingKey = JSON.stringify(padding ?? null);
  useEffect(() => {
    if (!bounds || !readyRef.current) return;
    fit(bounds, padding, true);
    // bounds/padding are tracked through their keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, paddingKey, fit]);

  const handleReady = () => {
    readyRef.current = true;
    if (bounds) fit(bounds, padding, false);
    onMapLoaded?.();
    onDidFinishLoadingMap?.();
  };

  // The container can resize (e.g. a sheet grows): fit again against the new size.
  const handleLayout = () => {
    if (readyRef.current && bounds) fit(bounds, padding, false);
  };

  const initialCamera = parsed.camera;
  const initialRegion: Region | undefined = useMemo(() => {
    if (bounds) return boundsRegion(bounds);
    const center = initialCamera?.centerCoordinate
      ? [initialCamera.centerCoordinate.longitude, initialCamera.centerCoordinate.latitude]
      : initialCamera?.initialViewState?.center;
    if (!center) return undefined;
    const zoom = initialCamera?.zoomLevel ?? initialCamera?.initialViewState?.zoom ?? 14;
    const delta = deltaFromZoom(zoom);
    return {
      latitude: center[1],
      longitude: center[0],
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
    // Only the first camera seeds the map; later changes are applied through fit/animate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const controller: AppMapCameraRef = useMemo(
    () => ({
      setCameraPosition: async (config) => {
        if (!config?.coordinates) return;
        mapRef.current?.animateCamera(
          { center: config.coordinates, zoom: config.zoom },
          { duration: config.duration ?? 300 },
        );
      },
      setStop: async ({ bounds: target, padding: pad }) => fit(target, pad, true),
      easeTo: async ({ center, zoom, duration }) => {
        mapRef.current?.animateCamera(
          { center: { latitude: center[1], longitude: center[0] }, zoom: zoom ?? 15 },
          { duration: duration ?? 500 },
        );
      },
    }),
    [fit],
  );
  useImperativeHandle(ref, () => controller, [controller]);

  const handleRegionComplete = (region: Region) => {
    onRegionDidChange?.({
      nativeEvent: {
        center: [region.longitude, region.latitude],
        zoom: zoomFromDelta(region.longitudeDelta),
      },
    });
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout} {...viewProps}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={parsed.userLocation}
        showsMyLocationButton={false}
        showsCompass={compass}
        showsScale={false}
        showsTraffic={false}
        toolbarEnabled={false}
        scrollEnabled={dragPan}
        zoomEnabled={touchZoom}
        rotateEnabled={touchRotate}
        pitchEnabled={touchPitch}
        onMapReady={handleReady}
        onRegionChangeComplete={onRegionDidChange ? handleRegionComplete : undefined}
        onPress={
          onMapClick
            ? (event) => onMapClick({ coordinates: event.nativeEvent.coordinate })
            : undefined
        }
      >
        {parsed.polylines.map((line, index) => (
          <Polyline
            key={`line-${index}`}
            coordinates={line.coordinates}
            strokeColor={line.strokeColor}
            strokeWidth={line.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        ))}
        {parsed.markers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.snippet}
            pinColor={marker.tintColor}
            anchor={ANCHORS[marker.anchor ?? 'center']}
            tracksViewChanges={false}
          >
            {marker.children}
          </Marker>
        ))}
      </MapView>

      {parsed.overlay.length > 0 ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {parsed.overlay}
        </View>
      ) : null}
    </View>
  );
});

const ANCHORS = {
  center: { x: 0.5, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  top: { x: 0.5, y: 0 },
  left: { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 },
} as const;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

// Common aliases for convenience
export {
  AppMapView as MapView,
  AppMapCamera as MapCamera,
  AppMapMarker as MapMarker,
  AppMapPolyline as MapPolyline,
  AppMapUserLocation as MapUserLocation,
};
export type {
  AppMapViewProps as MapViewProps,
  AppMapCameraProps as MapCameraProps,
  AppMapMarkerProps as MapMarkerProps,
  AppMapPolylineProps as MapPolylineProps,
  AppMapCoordinate as MapCoordinate,
  AppMapCameraRef as MapCameraRef,
  AppMapViewRef as MapViewRef,
};
