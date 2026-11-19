import { useState } from 'react';

import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppPressable,
  AppText,
  AppView,
  Icon,
} from '@/components/ui';
import { useGlidingPosition } from '@/hooks/use-gliding-position';
import { useThemeColor } from '@/hooks/use-theme-color';
import { pathDistanceKm, type GeoBounds, type GeoPoint } from '@/lib/geo';

import type { TrackingMapState } from '../tracking-geometry';
import { DropMarker, PickupMarker, VehicleMarker } from './map-markers';

const MAP_PADDING = { top: 36, left: 40, right: 40, bottom: 36 };

// Isolates 10Hz gliding updates from the map camera, route polyline, and static markers.
function GlidingDriverMarker({
  position,
  heading,
  vehicleName,
}: {
  position: GeoPoint | null;
  heading: number | null;
  vehicleName: string;
}) {
  const glidingDriver = useGlidingPosition(position, heading);
  if (!glidingDriver.position) return null;

  return (
    <AppMapMarker
      key="driver-vehicle-marker"
      coordinate={glidingDriver.position}
      title="Your driver"
      rotation={glidingDriver.heading ?? 0}
      flat
      zIndex={2}
    >
      <VehicleMarker vehicleName={vehicleName} />
    </AppMapMarker>
  );
}

function useStableMapBounds(map: TrackingMapState | null): GeoBounds | undefined {
  // Bucket remaining distance by 1.5x so the camera tightens in steps rather than on every GPS update.
  const remainingBucket = map
    ? Math.floor(Math.log(Math.max(pathDistanceKm(map.route), 0.1)) / Math.log(1.5))
    : 0;
  const fitKey = map
    ? `${map.arrived ? `${map.route[0].latitude}:${map.route[0].longitude}` : ''}:${map.arrived}:${map.endMarker}:${map.showStartMarker}:${map.driverPosition ? 'live' : 'idle'}:${remainingBucket}`
    : '';
  const [fit, setFit] = useState<{ key: string; bounds: GeoBounds | undefined }>({
    key: fitKey,
    bounds: map?.bounds,
  });
  if (fit.key !== fitKey) setFit({ key: fitKey, bounds: map?.bounds });
  return fit.bounds;
}

export interface TrackingMapProps {
  map: TrackingMapState | null;
  vehicleName: string;
  viaStops?: { point: GeoPoint; done: boolean }[];
  bottomInset?: number;
}

export function TrackingMap({
  map,
  vehicleName,
  viaStops = [],
  bottomInset = 0,
}: TrackingMapProps) {
  const brandColor = useThemeColor('brand');
  const mutedColor = useThemeColor('subtle');
  const bounds = useStableMapBounds(map);
  const [recenterCount, setRecenterCount] = useState(0);

  if (!map) {
    return (
      <AppView center className="flex-1 bg-surface-muted">
        <AppText className="text-[13px] text-subtle">This order was cancelled</AppText>
      </AppView>
    );
  }

  const { route, endMarker, showStartMarker, showRoute, routeMuted } = map;
  const routeColor = routeMuted ? mutedColor : brandColor;

  return (
    <AppView className="-mt-[25px] flex-1 overflow-hidden">
      <AppMapView className="flex-1 overflow-hidden">
        {bounds ? (
          <AppMapCamera
            key={recenterCount}
            bounds={bounds}
            padding={{ ...MAP_PADDING, bottom: MAP_PADDING.bottom + bottomInset }}
          />
        ) : null}
        {showRoute ? (
          <AppMapPolyline coordinates={route} strokeColor={routeColor} strokeWidth={4} />
        ) : null}
        <AppMapMarker
          key={`end-marker-${endMarker}`}
          coordinate={route[route.length - 1]}
          title={endMarker === 'pickup' ? 'Pickup' : 'Drop'}
        >
          {endMarker === 'pickup' ? <PickupMarker /> : <DropMarker />}
        </AppMapMarker>
        {showStartMarker ? (
          <AppMapMarker key="start-marker-pickup" coordinate={route[0]} title="Pickup">
            <PickupMarker />
          </AppMapMarker>
        ) : null}
        {!map.arrived &&
          viaStops.map((stop, i) => (
            <AppMapMarker key={`via-${i}`} coordinate={stop.point} title={`Stop ${i + 1}`}>
              <AppView
                center
                className={`size-7 rounded-full border-2 border-white ${stop.done ? 'bg-emerald-500' : 'bg-neutral-700'}`}
              >
                {stop.done ? (
                  <Icon name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <AppText className="text-[12px] font-bold text-white">{i + 1}</AppText>
                )}
              </AppView>
            </AppMapMarker>
          ))}
        <GlidingDriverMarker
          position={map.driverPosition}
          heading={map.driverHeading}
          vehicleName={vehicleName}
        />
      </AppMapView>
      <AppPressable
        onPress={() => setRecenterCount((count) => count + 1)}
        accessibilityLabel="Recenter map"
        hitSlop={8}
        style={{ bottom: bottomInset + 12 }}
        className="absolute right-3 size-11 items-center justify-center rounded-full bg-surface shadow-md"
      >
        <Icon name="location.north.fill" size={18} tone="brand" />
      </AppPressable>
    </AppView>
  );
}
