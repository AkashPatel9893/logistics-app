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
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useUniwind } from 'uniwind';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { distanceKm } from '@/lib/geo';
import { DARK_MAP_STYLE } from '@/lib/map-style-dark';

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
  /** Degrees clockwise from north; rotated natively, so changing it never re-draws the marker view. */
  rotation?: number;
  /** Rotate with the map instead of the screen (use with `rotation`). */
  flat?: boolean;
  zIndex?: number;
  /** Keep redrawing the marker view, for text that changes. Android otherwise snapshots it before the text draws. */
  tracksViewChanges?: boolean;
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
  /** Draws a dashed line, like the walking line from you to a pin. */
  dashed?: boolean;
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

export interface MapTether {
  from: AppMapCoordinate;
  /** The resting end (the map's center as last reported); the live center takes over while moving. */
  to: AppMapCoordinate;
  color: string;
}

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
  /**
   * Space covered by overlays (a header, a bottom sheet). The map's center, camera moves and
   * reported regions then all refer to the middle of the visible area, where a fixed pin sits.
   */
  contentInset?: { top: number; bottom: number; left?: number; right?: number };
  /** Fires once when the camera starts moving (drag, fling or animation); `onRegionDidChange` ends it. */
  onMoveStart?: () => void;
  /**
   * A straight dashed line from `from` (e.g. the user's location) to the map's center, where a
   * fixed pin sits. Drawn by the map itself and updated every frame while the camera moves, so it
   * stays on the pin's tip during fast drags without re-rendering the screen. No routing involved.
   */
  tether?: MapTether | null;
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
    onMoveStart,
    tether,
    contentInset,
    onMapClick,
    children,
    ...viewProps
  },
  ref,
) {
  const { theme } = useUniwind();
  const mapRef = useRef<MapView>(null);
  const readyRef = useRef(false);

  const parsed = useMemo(() => {
    const markers: { key: string; props: AppMapMarkerProps }[] = [];
    const polylines: { key: string; props: AppMapPolylineProps }[] = [];
    let camera: AppMapCameraProps | undefined;
    let cameraRef: Ref<AppMapCameraRef> | undefined;
    let userLocation = false;
    const overlay: ReactNode[] = [];
    React.Children.forEach(children, (child, idx) => {
      if (!React.isValidElement(child)) {
        if (child) overlay.push(child);
        return;
      }
      if (child.type === AppMapMarker) {
        markers.push({
          key: child.key != null ? String(child.key) : `marker-${idx}`,
          props: child.props as AppMapMarkerProps,
        });
      } else if (child.type === AppMapPolyline) {
        polylines.push({
          key: child.key != null ? String(child.key) : `polyline-${idx}`,
          props: child.props as AppMapPolylineProps,
        });
      } else if (child.type === AppMapCamera) {
        camera = child.props as AppMapCameraProps;
        // React 19 passes `ref` as a prop; AppMapCamera renders nothing, so the map answers for it.
        cameraRef = (child.props as { ref?: Ref<AppMapCameraRef> }).ref;
      } else if (child.type === AppMapUserLocation) {
        userLocation = true;
      } else {
        overlay.push(child);
      }
    });
    return { markers, polylines, camera, cameraRef, userLocation, overlay };
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
  useImperativeHandle(parsed.cameraRef, () => controller, [controller]);

  // Live camera center, handed straight to the tether: one update per screen frame at most.
  const tetherRef = useRef<TetherHandle>(null);
  const movingRef = useRef(false);
  const pendingCenterRef = useRef<AppMapCoordinate | null>(null);
  const frameRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );
  const lastSampleRef = useRef<{ region: Region; time: number } | null>(null);
  const lastTetherFrameRef = useRef(0);
  const slowFramesRef = useRef(false);
  const isFastRef = useRef(false);
  const handleRegionChange = (region: Region) => {
    if (!movingRef.current) {
      movingRef.current = true;
      lastSampleRef.current = null;
      isFastRef.current = false;
      onMoveStart?.();
    }
    if (!tether) return;
    // The map reports its position a frame or two after drawing it, so in a fast fling any line
    // drawn from those reports trails the pin. Hide it while the map moves faster than that lag can
    // hide (in screens per second), with a lower bar to bring it back so it doesn't flicker.
    const now = Date.now();
    const last = lastSampleRef.current;
    if (last && now > last.time) {
      const screens =
        Math.hypot(
          (region.latitude - last.region.latitude) / (region.latitudeDelta || 1),
          (region.longitude - last.region.longitude) / (region.longitudeDelta || 1),
        ) /
        ((now - last.time) / 1000);
      isFastRef.current = screens > (isFastRef.current ? TETHER_SHOW_BELOW : TETHER_HIDE_ABOVE);
    }
    lastSampleRef.current = { region, time: now };
    pendingCenterRef.current = { latitude: region.latitude, longitude: region.longitude };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame((now) => {
      frameRef.current = null;
      // A phone already dropping frames gets the line at ~30 fps instead of every frame, so the
      // line doesn't add to the drag's cost exactly when the device can least afford it.
      const sinceLast = now - lastTetherFrameRef.current;
      if (sinceLast < TETHER_MIN_INTERVAL_MS && slowFramesRef.current) return;
      slowFramesRef.current = sinceLast > SLOW_FRAME_MS && sinceLast < 200;
      lastTetherFrameRef.current = now;
      tetherRef.current?.setLive(
        isFastRef.current ? 'hidden' : (pendingCenterRef.current ?? 'hidden'),
      );
    });
  };

  const handleRegionComplete = (region: Region) => {
    movingRef.current = false;
    pendingCenterRef.current = null;
    // A frame queued during the move must not land after this and hide the resting line.
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    // At rest the line ends on the final center, exactly the pin's tip; set here so it doesn't wait
    // a render for the screen to pass the new center down.
    tetherRef.current?.setLive({ latitude: region.latitude, longitude: region.longitude });
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
        // Follows the phone's dark mode, like the night maps of ride apps.
        customMapStyle={theme === 'dark' ? DARK_MAP_STYLE : undefined}
        userInterfaceStyle={theme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        mapPadding={
          contentInset
            ? {
                top: contentInset.top,
                bottom: contentInset.bottom,
                left: contentInset.left ?? 0,
                right: contentInset.right ?? 0,
              }
            : undefined
        }
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
        onRegionChangeComplete={handleRegionComplete}
        onRegionChange={onMoveStart || tether ? handleRegionChange : undefined}
        onPress={
          onMapClick
            ? (event) => onMapClick({ coordinates: event.nativeEvent.coordinate })
            : undefined
        }
      >
        {tether ? <PinTether ref={tetherRef} tether={tether} /> : null}
        {parsed.polylines.map(({ key, props: line }) => (
          <Polyline
            key={key}
            coordinates={line.coordinates}
            strokeColor={line.strokeColor}
            strokeWidth={line.strokeWidth}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={line.dashed ? [8, 8] : undefined}
          />
        ))}
        {parsed.markers.map(({ key, props: marker }) => (
          <Marker
            key={key}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.snippet}
            pinColor={marker.tintColor}
            anchor={ANCHORS[marker.anchor ?? 'center']}
            rotation={marker.rotation}
            flat={marker.flat}
            zIndex={marker.zIndex}
            tracksViewChanges={marker.tracksViewChanges ?? false}
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

// ─── Pin tether ────────────────────────────────────────────────────────────

/** Closer than this the dot sits on the pin; farther, the line would just cross the city. */
const TETHER_MIN_METRES = 15;
const TETHER_MAX_METRES = 20_000;

/** A frame gap above this means the phone is struggling (below ~45 fps). */
const SLOW_FRAME_MS = 22;
/** Line update cap on such a phone: ~30 fps. */
const TETHER_MIN_INTERVAL_MS = 33;

/** Map speeds (screens per second) at which the line hides during a move, and comes back. */
const TETHER_HIDE_ABOVE = 1.2;
const TETHER_SHOW_BELOW = 0.6;

/** `null`: not moved yet, use `tether.to`. `'hidden'`: moving too fast to draw truthfully. */
type LiveEnd = AppMapCoordinate | 'hidden' | null;

interface TetherHandle {
  setLive: (end: LiveEnd) => void;
}

/**
 * Owns the only state that changes every frame during a drag, so a frame re-renders just this
 * one polyline, not the map's other children or the screen around it.
 */
const PinTether = forwardRef<TetherHandle, { tether: MapTether }>(function PinTether(
  { tether },
  ref,
) {
  const [live, setLive] = useState<LiveEnd>(null);
  useImperativeHandle(ref, () => ({ setLive }), []);
  if (live === 'hidden') return null;
  const to = live ?? tether.to;
  const metres = distanceKm(tether.from, to) * 1000;
  if (metres < TETHER_MIN_METRES || metres > TETHER_MAX_METRES) return null;
  return (
    <Polyline
      coordinates={[tether.from, to]}
      strokeColor={tether.color}
      strokeWidth={2}
      lineCap="round"
      lineDashPattern={[8, 8]}
    />
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
