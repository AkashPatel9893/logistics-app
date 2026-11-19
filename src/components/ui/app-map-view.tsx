import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import type { View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useUniwind, withUniwind } from 'uniwind';

import { DARK_MAP_STYLE } from '@/config/theme';
import { cn } from '@/lib/cn';
import type { StyleProp, ViewStyle } from '@/lib/native';

import { AppView } from './app-view';
import {
  PinTether,
  SLOW_FRAME_MS,
  TETHER_HIDE_ABOVE,
  TETHER_MIN_INTERVAL_MS,
  TETHER_SHOW_BELOW,
  type MapCoordinate,
  type MapTether,
  type TetherHandle,
} from './map-pin-tether';

const StyledMapView = withUniwind(MapView, { style: { fromClassName: 'className' } });

export type { MapTether };
export type AppMapCoordinate = MapCoordinate;
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
    center: [number, number];
    zoom?: number;
    duration?: number;
    padding?: CameraPadding;
  }) => Promise<void>;
}

export type AppMapViewRef = AppMapCameraRef;

const DEFAULT_PADDING = 40;

const ANCHORS = {
  center: { x: 0.5, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  top: { x: 0.5, y: 0 },
  left: { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 },
} as const;

export interface AppMapMarkerProps {
  coordinate: AppMapCoordinate;
  title?: string;
  snippet?: string;
  anchor?: 'center' | 'bottom' | 'top' | 'left' | 'right';
  tintColor?: string;
  systemImage?: string;
  rotation?: number;
  flat?: boolean;
  zIndex?: number;
  tracksViewChanges?: boolean;
  children?: ReactNode;
}

export function AppMapMarker(_props: AppMapMarkerProps): ReactElement | null {
  return null;
}

export interface AppMapPolylineProps {
  coordinates: AppMapCoordinate[];
  strokeColor: string;
  strokeWidth: number;
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
    center?: [number, number];
    zoom?: number;
    bounds?: GeoBounds;
    padding?: CameraPadding;
  };
}

export const AppMapCamera = forwardRef<AppMapCameraRef, AppMapCameraProps>(
  function AppMapCamera(_props, _ref) {
    return null;
  },
);

export function AppMapUserLocation(): ReactElement | null {
  return null;
}

const zoomFromDelta = (lngDelta: number) => Math.log2(360 / Math.max(lngDelta, 1e-6));
const deltaFromZoom = (zoom: number) => 360 / 2 ** zoom;

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

function parseMapChildren(children: ReactNode) {
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
      cameraRef = (child.props as { ref?: Ref<AppMapCameraRef> }).ref;
    } else if (child.type === AppMapUserLocation) {
      userLocation = true;
    } else {
      overlay.push(child);
    }
  });

  return { markers, polylines, camera, cameraRef, userLocation, overlay };
}

export interface AppMapViewProps extends ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  compass?: boolean;
  dragPan?: boolean;
  touchZoom?: boolean;
  touchRotate?: boolean;
  touchPitch?: boolean;
  onMapLoaded?: () => void;
  onDidFinishLoadingMap?: () => void;
  onRegionDidChange?: (event: { nativeEvent: { center: [number, number]; zoom: number } }) => void;
  contentInset?: { top: number; bottom: number; left?: number; right?: number };
  onMoveStart?: () => void;
  tether?: MapTether | null;
  onMapClick?: (event: { coordinates: AppMapCoordinate }) => void;
  children?: ReactNode;
}

export const AppMapView = forwardRef<AppMapViewRef, AppMapViewProps>(function AppMapView(
  {
    className,
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
  const parsed = parseMapChildren(children);

  const bounds = parsed.camera?.bounds ?? parsed.camera?.initialViewState?.bounds;
  const padding = parsed.camera?.padding ?? parsed.camera?.initialViewState?.padding;
  const boundsKey = bounds ? bounds.map((n) => n.toFixed(3)).join(',') : '';

  const fit = (target: GeoBounds, pad?: CameraPadding, animated = true) => {
    mapRef.current?.fitToCoordinates(boundsCorners(target), {
      edgePadding: toEdgePadding(pad),
      animated,
    });
  };

  const paddingKey = JSON.stringify(padding ?? null);
  useEffect(() => {
    if (!bounds || !readyRef.current) return;
    fit(bounds, padding, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, paddingKey]);

  const handleReady = () => {
    readyRef.current = true;
    if (bounds) fit(bounds, padding, false);
    onMapLoaded?.();
    onDidFinishLoadingMap?.();
  };

  const handleLayout = () => {
    if (readyRef.current && bounds) fit(bounds, padding, false);
  };

  const initialCamera = parsed.camera;
  const [initialRegion] = useState<Region | undefined>(() => {
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
  });

  const createCameraController = (): AppMapCameraRef => ({
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
  });
  useImperativeHandle(ref, createCameraController);
  useImperativeHandle(parsed.cameraRef, createCameraController);

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
    frameRef.current = requestAnimationFrame((frameTime) => {
      frameRef.current = null;
      const sinceLast = frameTime - lastTetherFrameRef.current;
      if (sinceLast < TETHER_MIN_INTERVAL_MS && slowFramesRef.current) return;
      slowFramesRef.current = sinceLast > SLOW_FRAME_MS && sinceLast < 200;
      lastTetherFrameRef.current = frameTime;
      tetherRef.current?.setLive(
        isFastRef.current ? 'hidden' : (pendingCenterRef.current ?? 'hidden'),
      );
    });
  };

  const handleRegionComplete = (region: Region) => {
    movingRef.current = false;
    pendingCenterRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    tetherRef.current?.setLive({ latitude: region.latitude, longitude: region.longitude });
    onRegionDidChange?.({
      nativeEvent: {
        center: [region.longitude, region.latitude],
        zoom: zoomFromDelta(region.longitudeDelta),
      },
    });
  };

  return (
    <AppView
      className={cn('overflow-hidden', className)}
      style={style}
      onLayout={handleLayout}
      {...viewProps}
    >
      <StyledMapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={theme === 'dark' ? DARK_MAP_STYLE : undefined}
        userInterfaceStyle={theme === 'dark' ? 'dark' : 'light'}
        className="absolute inset-0"
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
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionComplete}
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
      </StyledMapView>

      {parsed.overlay.length > 0 ? (
        <AppView pointerEvents="box-none" className="absolute inset-0">
          {parsed.overlay}
        </AppView>
      ) : null}
    </AppView>
  );
});

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
