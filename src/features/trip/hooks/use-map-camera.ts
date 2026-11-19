import { useRef, useState } from 'react';

import type { AppMapCameraRef } from '@/components/ui';
import type { GeoPoint } from '@/lib/geo';

const FOCUS_ZOOM = 16;
const MIN_FIT_ZOOM = 10;
const FIT_MARGIN_X = 80;
const FIT_MARGIN_Y = 48;
const PIN_HEIGHT = 80;
const METRES_PER_DP_Z0 = 156_543.03;

export interface PathFrame {
  zoom: number;
  pinOffset: { x: number; y: number };
}

export function framePath(
  pin: GeoPoint,
  other: GeoPoint,
  visible: { width: number; height: number },
): PathFrame {
  const cosLat = Math.cos((pin.latitude * Math.PI) / 180);
  const eastMetres = (other.longitude - pin.longitude) * 111_320 * cosLat;
  const northMetres = (other.latitude - pin.latitude) * 110_540;
  const usableWidth = Math.max(visible.width - 2 * FIT_MARGIN_X, 1);
  const usableHeight = Math.max(
    visible.height - 2 * FIT_MARGIN_Y - PIN_HEIGHT,
    visible.height * 0.35,
    1,
  );
  const neededMetresPerDp = Math.max(
    Math.abs(eastMetres) / usableWidth,
    Math.abs(northMetres) / usableHeight,
  );
  const fitZoom =
    neededMetresPerDp > 0 ? Math.log2((METRES_PER_DP_Z0 * cosLat) / neededMetresPerDp) : FOCUS_ZOOM;
  const zoom = Math.min(FOCUS_ZOOM, Math.max(MIN_FIT_ZOOM, fitZoom));
  const metresPerDp = (METRES_PER_DP_Z0 * cosLat) / 2 ** zoom;
  const dx = eastMetres / metresPerDp;
  const dy = -northMetres / metresPerDp;
  return { zoom, pinOffset: { x: -dx / 2, y: -dy / 2 + PIN_HEIGHT / 2 } };
}

export interface CameraPadding {
  top: number;
  bottom: number;
}

export function useMapCamera(initialCenter: GeoPoint, padding: CameraPadding) {
  const cameraRef = useRef<AppMapCameraRef>(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef<{ point: GeoPoint; duration: number; zoom?: number } | null>(null);
  const [center, setCenter] = useState<GeoPoint>(initialCenter);

  const easeTo = (point: GeoPoint, duration: number, zoom = FOCUS_ZOOM) => {
    cameraRef.current?.easeTo({
      center: [point.longitude, point.latitude],
      zoom,
      duration,
      padding,
    });
  };

  const animateTo = (point: GeoPoint, duration = 600, zoom?: number) => {
    setCenter(point);
    if (isReadyRef.current && cameraRef.current) {
      easeTo(point, duration, zoom);
    } else {
      pendingRef.current = { point, duration, zoom };
    }
  };

  const handleMapReady = () => {
    isReadyRef.current = true;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) easeTo(pending.point, pending.duration, pending.zoom);
  };

  return { cameraRef, center, setCenter, animateTo, handleMapReady, zoom: FOCUS_ZOOM };
}
