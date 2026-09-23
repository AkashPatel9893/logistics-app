import { useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';

import { AppText, AppView } from '@/components/ui';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
  type OlaMapCameraRef,
} from '@/components/ui/ola-map-view';
import { useThemeColor } from '@/hooks/use-theme-color';

import type { TrackingMapState } from '../hooks/use-order-tracking';
import { DriverMarker, RouteEndpointMarker } from './map-markers';

const MAP_PADDING = { top: 36, left: 40, right: 40, bottom: 36 };
const REFIT_DURATION_MS = 300;

export interface TrackingMapProps {
  map: TrackingMapState | null;
  vehicleImage: ImageSourcePropType;
}

export function TrackingMap({ map, vehicleImage }: TrackingMapProps) {
  const routeColor = useThemeColor('brand');
  const cameraRef = useRef<OlaMapCameraRef>(null);
  const [mapHeight, setMapHeight] = useState(0);
  const fittedHeightRef = useRef(0);
  const bounds = map?.bounds;
  const boundsRef = useRef(bounds);
  useEffect(() => {
    boundsRef.current = bounds;
  });

  // The sheet below grows as the order progresses (driver card, rating), which
  // shrinks the map after the camera first fit the route and pushed markers out
  // of view. Re-fit when the map's height changes after that first fit (which
  // `initialViewState` handles — the native camera may not exist yet then).
  useEffect(() => {
    const previous = fittedHeightRef.current;
    fittedHeightRef.current = mapHeight;
    const latest = boundsRef.current;
    if (previous === 0 || previous === mapHeight || !latest) return;
    cameraRef.current
      ?.setStop({ bounds: latest, padding: MAP_PADDING, duration: REFIT_DURATION_MS })
      // The camera can be re-keyed (new leg) or unmounted mid-refit; nothing to do then.
      .catch(() => {});
  }, [mapHeight]);

  if (!map) {
    return (
      <AppView center className="flex-1 bg-surface-muted">
        <AppText className="text-[13px] text-subtle">This order was cancelled</AppText>
      </AppView>
    );
  }

  const { route, endMarker, showStartMarker, driverPosition } = map;

  return (
    <AppView
      className="flex-1 overflow-hidden"
      style={{ marginTop: -25 }}
      onLayout={(event: LayoutChangeEvent) => setMapHeight(event.nativeEvent.layout.height)}
    >
      <OlaMapView style={{ flex: 1, overflow: 'hidden' }}>
        {/* Keyed by leg so the camera re-fits when the driver switches legs. */}
        {bounds ? (
          <OlaMapCamera
            key={endMarker}
            ref={cameraRef}
            initialViewState={{ bounds, padding: MAP_PADDING }}
          />
        ) : null}
        <OlaMapPolyline coordinates={route} strokeColor={routeColor} strokeWidth={4} />
        <OlaMapMarker coordinate={route[route.length - 1]}>
          <RouteEndpointMarker variant={endMarker} />
        </OlaMapMarker>
        {showStartMarker ? (
          <OlaMapMarker coordinate={route[0]}>
            <RouteEndpointMarker variant="pickup" />
          </OlaMapMarker>
        ) : null}
        {driverPosition ? (
          <OlaMapMarker coordinate={driverPosition}>
            <DriverMarker vehicleImage={vehicleImage} />
          </OlaMapMarker>
        ) : null}
      </OlaMapView>
    </AppView>
  );
}
