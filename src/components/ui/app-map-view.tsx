/**
 * AppMapView — renders native Google Maps on Android and Apple Maps on iOS
 * powered by the official Expo `expo-maps` package.
 *
 * Usage:
 *   import { AppMapView, AppMapCamera, AppMapMarker, AppMapPolyline } from '@/components/ui';
 *
 *   <AppMapView ref={mapRef} style={{ flex: 1 }}>
 *     <AppMapCamera centerCoordinate={{ latitude, longitude }} zoomLevel={15} />
 *     <AppMapMarker coordinate={{ latitude, longitude }}>{...}</AppMapMarker>
 *     <AppMapPolyline coordinates={[...]} strokeColor="#FF5A1F" strokeWidth={4} />
 *   </AppMapView>
 */
import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  AppleMaps,
  GoogleMaps,
  type CameraMoveEvent,
  type CameraPosition,
  type Coordinates,
} from 'expo-maps';

// ─── Types & Coordinates ────────────────────────────────────────────────────

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
  setCameraPosition: (config?: CameraPosition & { duration?: number }) => Promise<void>;
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

/** Convert bounding box [west, south, east, north] into a CameraPosition */
export function boundsToCamera(bounds: GeoBounds, _padding?: CameraPadding): CameraPosition {
  const [west, south, east, north] = bounds;
  const latDelta = Math.max(Math.abs(north - south), 0.0005);
  const lngDelta = Math.max(Math.abs(east - west), 0.0005);

  const latZoom = Math.log2(180 / latDelta);
  const lngZoom = Math.log2(360 / lngDelta);
  const zoom = Math.min(latZoom, lngZoom);
  const clampedZoom = Math.min(Math.max(Math.round(zoom), 3), 18);

  return {
    coordinates: {
      latitude: (south + north) / 2,
      longitude: (west + east) / 2,
    },
    zoom: clampedZoom,
  };
}

// ─── Camera Context for Children ───────────────────────────────────────────

interface CameraContextValue {
  registerCameraRef: (ref: AppMapCameraRef | null) => void;
}

const CameraContext = createContext<CameraContextValue | null>(null);

// ─── Marker ────────────────────────────────────────────────────────────────

export interface AppMapMarkerProps {
  coordinate: AppMapCoordinate;
  title?: string;
  snippet?: string;
  anchor?: 'center' | 'bottom' | 'top' | 'left' | 'right';
  children?: ReactNode;
}

export function AppMapMarker(_props: AppMapMarkerProps): ReactElement | null {
  // Marker configuration is extracted by AppMapView from children
  return null;
}

// ─── Polyline ──────────────────────────────────────────────────────────────

export interface AppMapPolylineProps {
  coordinates: AppMapCoordinate[];
  strokeColor: string;
  strokeWidth: number;
}

export function AppMapPolyline(_props: AppMapPolylineProps): ReactElement | null {
  // Polyline configuration is extracted by AppMapView from children
  return null;
}

// ─── Camera ────────────────────────────────────────────────────────────────

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

export const AppMapCamera = forwardRef<AppMapCameraRef, AppMapCameraProps>(
  function AppMapCamera(_props, ref) {
    const ctx = useContext(CameraContext);

    useImperativeHandle(
      ref,
      () => ({
        setCameraPosition: async (config) => {
          await internalControllerRef.current?.setCameraPosition(config);
        },
        setStop: async (opts) => {
          await internalControllerRef.current?.setStop(opts);
        },
        easeTo: async (opts) => {
          await internalControllerRef.current?.easeTo(opts);
        },
      }),
      [],
    );

    const internalControllerRef = useRef<AppMapCameraRef | null>(null);

    useEffect(() => {
      ctx?.registerCameraRef(internalControllerRef.current);
      return () => ctx?.registerCameraRef(null);
    }, [ctx]);

    return null;
  },
);

// ─── UserLocation ──────────────────────────────────────────────────────────

export function AppMapUserLocation(): ReactElement | null {
  return null;
}

// ─── Map View ──────────────────────────────────────────────────────────────

export interface AppMapViewProps extends ComponentPropsWithoutRef<typeof View> {
  style?: StyleProp<ViewStyle>;
  cameraPosition?: CameraPosition;
  compass?: boolean;
  dragPan?: boolean;
  touchZoom?: boolean;
  touchRotate?: boolean;
  touchPitch?: boolean;
  uiSettings?: GoogleMaps.MapUISettings;
  onMapLoaded?: () => void;
  onDidFinishLoadingMap?: () => void;
  onCameraMove?: (event: CameraMoveEvent) => void;
  onRegionDidChange?: (event: { nativeEvent: { center: [number, number]; zoom: number } }) => void;
  onMapClick?: (event: { coordinates: Coordinates }) => void;
  children?: ReactNode;
}

export const AppMapView = forwardRef<AppMapViewRef, AppMapViewProps>(function AppMapView(
  {
    style,
    cameraPosition,
    compass = true,
    dragPan = true,
    touchZoom = true,
    touchRotate = true,
    touchPitch = true,
    uiSettings,
    onMapLoaded,
    onDidFinishLoadingMap,
    onCameraMove,
    onRegionDidChange,
    onMapClick,
    children,
    ...viewProps
  },
  ref,
) {
  const nativeRef = useRef<any>(null);
  const childCameraRef = useRef<AppMapCameraRef | null>(null);

  // Extract markers, polylines, camera and userLocation directives from children
  const { markers, polylines, initialCamera, hasUserLocation, overlayChildren } = useMemo(() => {
    const parsedMarkers: GoogleMaps.Marker[] = [];
    const parsedPolylines: GoogleMaps.MapProps['polylines'] = [];
    let foundCamera: CameraPosition | undefined;
    let foundUserLocation = false;
    const nonMapChildren: ReactNode[] = [];

    let markerIndex = 0;
    let polylineIndex = 0;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        if (child) nonMapChildren.push(child);
        return;
      }

      const type = child.type;

      if (type === AppMapMarker) {
        const p = child.props as AppMapMarkerProps;
        parsedMarkers.push({
          id: `marker-${markerIndex++}`,
          coordinates: { latitude: p.coordinate.latitude, longitude: p.coordinate.longitude },
          title: p.title,
          snippet: p.snippet,
        });
      } else if (type === AppMapPolyline) {
        const p = child.props as AppMapPolylineProps;
        parsedPolylines.push({
          id: `polyline-${polylineIndex++}`,
          coordinates: p.coordinates.map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          })),
          color: p.strokeColor,
          width: p.strokeWidth,
        });
      } else if (type === AppMapCamera) {
        const p = child.props as AppMapCameraProps;
        if (p.bounds) {
          foundCamera = boundsToCamera(p.bounds, p.padding);
        } else if (p.initialViewState?.bounds) {
          foundCamera = boundsToCamera(p.initialViewState.bounds, p.initialViewState.padding);
        } else if (p.centerCoordinate) {
          foundCamera = {
            coordinates: {
              latitude: p.centerCoordinate.latitude,
              longitude: p.centerCoordinate.longitude,
            },
            zoom: p.zoomLevel ?? 14,
          };
        } else if (p.initialViewState?.center) {
          const [lng, lat] = p.initialViewState.center;
          foundCamera = {
            coordinates: { latitude: lat, longitude: lng },
            zoom: p.initialViewState.zoom ?? 14,
          };
        }
      } else if (type === AppMapUserLocation) {
        foundUserLocation = true;
      } else {
        nonMapChildren.push(child);
      }
    });

    return {
      markers: parsedMarkers,
      polylines: parsedPolylines,
      initialCamera: foundCamera,
      hasUserLocation: foundUserLocation,
      overlayChildren: nonMapChildren,
    };
  }, [children]);

  // Unified camera controller
  const controller: AppMapCameraRef = useMemo(
    () => ({
      setCameraPosition: async (config) => {
        if (!nativeRef.current) return;
        try {
          await nativeRef.current.setCameraPosition(config);
        } catch {
          // Native map view unmounted or interrupted
        }
      },
      setStop: async ({ bounds, padding, duration }) => {
        if (!nativeRef.current) return;
        const target = boundsToCamera(bounds, padding);
        try {
          await nativeRef.current.setCameraPosition({
            coordinates: target.coordinates,
            zoom: target.zoom,
            duration: duration ?? 300,
          });
        } catch {
          // Ignore interruption
        }
      },
      easeTo: async ({ center, zoom, duration }) => {
        if (!nativeRef.current) return;
        try {
          await nativeRef.current.setCameraPosition({
            coordinates: { latitude: center[1], longitude: center[0] },
            zoom: zoom ?? 15,
            duration: duration ?? 500,
          });
        } catch {
          // Ignore interruption
        }
      },
    }),
    [],
  );

  // Expose controller via ref
  useImperativeHandle(ref, () => controller, [controller]);

  // Map settings for Google Maps
  const googleUiSettings = useMemo<GoogleMaps.MapUISettings>(() => {
    return {
      compassEnabled: compass && uiSettings?.compassEnabled !== false,
      scrollGesturesEnabled: dragPan && uiSettings?.scrollGesturesEnabled !== false,
      zoomGesturesEnabled: touchZoom && uiSettings?.zoomGesturesEnabled !== false,
      rotationGesturesEnabled: touchRotate && uiSettings?.rotationGesturesEnabled !== false,
      tiltGesturesEnabled: touchPitch && uiSettings?.tiltGesturesEnabled !== false,
      myLocationButtonEnabled: hasUserLocation,
      ...uiSettings,
    };
  }, [compass, dragPan, touchZoom, touchRotate, touchPitch, hasUserLocation, uiSettings]);

  const activeCamera = cameraPosition ?? initialCamera;

  const handleCameraMove = (event: CameraMoveEvent) => {
    onCameraMove?.(event);
    if (
      onRegionDidChange &&
      event.coordinates?.latitude != null &&
      event.coordinates?.longitude != null
    ) {
      onRegionDidChange({
        nativeEvent: {
          center: [event.coordinates.longitude, event.coordinates.latitude],
          zoom: event.zoom,
        },
      });
    }
  };

  const handleMapLoaded = () => {
    onMapLoaded?.();
    onDidFinishLoadingMap?.();
  };

  const cameraContextValue = useMemo<CameraContextValue>(
    () => ({
      registerCameraRef: (r) => {
        childCameraRef.current = r;
      },
    }),
    [],
  );

  return (
    <CameraContext.Provider value={cameraContextValue}>
      <View style={[styles.container, style]} {...viewProps}>
        {Platform.OS === 'android' ? (
          <GoogleMaps.View
            ref={nativeRef}
            style={StyleSheet.absoluteFill}
            cameraPosition={activeCamera}
            markers={markers}
            polylines={polylines}
            uiSettings={googleUiSettings}
            properties={{ isMyLocationEnabled: hasUserLocation }}
            onMapLoaded={handleMapLoaded}
            onCameraMove={handleCameraMove}
            onMapClick={onMapClick}
          />
        ) : Platform.OS === 'ios' ? (
          <AppleMaps.View
            ref={nativeRef}
            style={StyleSheet.absoluteFill}
            cameraPosition={activeCamera}
            markers={markers}
            polylines={polylines}
            uiSettings={{
              compassEnabled: compass && uiSettings?.compassEnabled !== false,
              myLocationButtonEnabled: hasUserLocation,
              scaleBarEnabled: true,
              togglePitchEnabled: touchPitch,
            }}
            onCameraMove={handleCameraMove}
            onMapClick={onMapClick}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webFallback]}>
            {/* Fallback for web preview */}
          </View>
        )}

        {/* Any overlay children (custom buttons, floating markers, etc.) */}
        {overlayChildren.length > 0 ? (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {overlayChildren}
          </View>
        ) : null}
      </View>
    </CameraContext.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webFallback: {
    backgroundColor: '#f1f5f9',
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
