import { useState } from 'react';

import {
  AppMapCamera,
  AppMapMarker,
  AppMapPolyline,
  AppMapView,
  AppText,
  AppView,
} from '@/components/ui';
import { useGlidingPosition } from '@/hooks/use-gliding-position';
import { useThemeColor } from '@/hooks/use-theme-color';
import { pathDistanceKm, type GeoBounds } from '@/lib/geo';

import type { TrackingMapState } from '../hooks/use-order-tracking';
import { DropMarker, PickupMarker, VehicleHeadingArrow, VehicleMarker } from './map-markers';

const MAP_PADDING = { top: 36, left: 40, right: 40, bottom: 36 };

export interface TrackingMapProps {
  map: TrackingMapState | null;
  /** Vehicle type name, picks the moving marker's icon. */
  vehicleName: string;
}

export function TrackingMap({ map, vehicleName }: TrackingMapProps) {
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
        {bounds ? <AppMapCamera bounds={bounds} padding={MAP_PADDING} /> : null}
        {showRoute ? (
          <AppMapPolyline coordinates={route} strokeColor={routeColor} strokeWidth={4} />
        ) : null}
        <AppMapMarker
          coordinate={route[route.length - 1]}
          title={endMarker === 'pickup' ? 'Pickup' : 'Drop'}
        >
          {endMarker === 'pickup' ? <PickupMarker /> : <DropMarker />}
        </AppMapMarker>
        {showStartMarker ? (
          <AppMapMarker coordinate={route[0]} title="Pickup">
            <PickupMarker />
          </AppMapMarker>
        ) : null}
        {glidingDriver.position ? (
          <AppMapMarker coordinate={glidingDriver.position} title="Your driver">
            <VehicleMarker vehicleName={vehicleName} />
          </AppMapMarker>
        ) : null}
        {glidingDriver.position && glidingDriver.heading !== null ? (
          <AppMapMarker
            coordinate={glidingDriver.position}
            rotation={glidingDriver.heading}
            flat
            zIndex={2}
          >
            <VehicleHeadingArrow color={brandColor} />
          </AppMapMarker>
        ) : null}
      </AppMapView>
    </AppView>
  );
}
