import { useRef, useState } from 'react';

import type { OlaMapCameraRef } from '@/components/ui/ola-map-view';
import type { GeoPoint } from '@/lib/geo';

const FOCUS_ZOOM = 16;

export interface CameraPadding {
  top: number;
  bottom: number;
}

/**
 * Tracks the map's center coordinate and eases the camera to new points,
 * queueing a move requested before the map style has finished loading.
 */
export function useMapCamera(initialCenter: GeoPoint, padding: CameraPadding) {
  const cameraRef = useRef<OlaMapCameraRef>(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef<{ point: GeoPoint; duration: number } | null>(null);
  const [center, setCenter] = useState<GeoPoint>(initialCenter);

  const easeTo = (point: GeoPoint, duration: number) => {
    cameraRef.current?.easeTo({
      center: [point.longitude, point.latitude],
      zoom: FOCUS_ZOOM,
      duration,
      padding,
    });
  };

  const animateTo = (point: GeoPoint, duration = 600) => {
    setCenter(point);
    if (isReadyRef.current && cameraRef.current) {
      easeTo(point, duration);
    } else {
      pendingRef.current = { point, duration };
    }
  };

  const handleMapReady = () => {
    isReadyRef.current = true;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) easeTo(pending.point, pending.duration);
  };

  return { cameraRef, center, setCenter, animateTo, handleMapReady, zoom: FOCUS_ZOOM };
}
