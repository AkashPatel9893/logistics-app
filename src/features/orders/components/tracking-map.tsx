import { useState } from 'react';
import { Pressable } from 'react-native';

import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppText,
  AppView,
  Icon,
} from '@/components/ui';
import { useGlidingPosition } from '@/hooks/use-gliding-position';
import { useThemeColor } from '@/hooks/use-theme-color';
import { pathDistanceKm, type GeoBounds, type GeoPoint } from '@/lib/geo';

import type { TrackingMapState } from '../hooks/use-order-tracking';
import { DropMarker, PickupMarker, VehicleMarker } from './map-markers';

const MAP_PADDING = { top: 36, left: 40, right: 40, bottom: 36 };

export interface TrackingMapProps {
  map: TrackingMapState | null;
  /** Vehicle type name, picks the moving marker's icon. */
  vehicleName: string;
  /** Stops between pickup and the final drop, numbered on the map. */
  viaStops?: { point: GeoPoint; done: boolean }[];
}

export function TrackingMap({ map, vehicleName, viaStops = [] }: TrackingMapProps) {
  const brandColor = useThemeColor('brand');
  const mutedColor = useThemeColor('subtle');
  const glidingDriver = useGlidingPosition(map?.driverPosition ?? null, map?.driverHeading ?? null);

  // The map re-fits whenever the bounds it is given change, so handing it the live bounds would
  // move the camera every ~100 m and make the vehicle seem to wander. Keep the bounds fixed until
  // the picture really changes: the line switches (trip preview → driver's approach → trip to
  // drop), a position first arrives, or the distance left has shrunk by a third. Zoom then
  // tightens in a few calm steps as the vehicle nears the stop.
  const remainingBucket = map
    ? Math.floor(Math.log(Math.max(pathDistanceKm(map.route), 0.1)) / Math.log(1.5))
    : 0;
  const fitKey = map
    ? `${map.endMarker}:${map.showStartMarker}:${map.driverPosition ? 'live' : 'idle'}:${remainingBucket}`
    : '';
  const [fit, setFit] = useState<{ key: string; bounds: GeoBounds | undefined }>({
    key: fitKey,
    bounds: map?.bounds,
  });
  if (fit.key !== fitKey) setFit({ key: fitKey, bounds: map?.bounds });
  const bounds = fit.bounds;
  // Bumped by the recenter button so the camera fits the route again after the user panned away.
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
    <AppView className="flex-1 overflow-hidden" style={{ marginTop: -25 }}>
      <AppMapView style={{ flex: 1, overflow: 'hidden' }}>
        {/* The map re-fits to these bounds whenever they change (and when its size changes). */}
        {bounds ? <AppMapCamera key={recenterCount} bounds={bounds} padding={MAP_PADDING} /> : null}
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
        {viaStops.map((stop, i) => (
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
        {glidingDriver.position ? (
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
        ) : null}
      </AppMapView>
      <Pressable
        onPress={() => setRecenterCount((count) => count + 1)}
        accessibilityLabel="Recenter map"
        hitSlop={8}
        className="absolute bottom-3 right-3 size-11 items-center justify-center rounded-full bg-surface shadow-md"
      >
        <Icon name="location.north.fill" size={18} tone="brand" />
      </Pressable>
    </AppView>
  );
}
