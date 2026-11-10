import { useRef, useState } from 'react';

import type { AppMapCameraRef } from '@/components/ui';
import type { GeoPoint } from '@/lib/geo';

const FOCUS_ZOOM = 16;
/** Never zoom out past a whole-city view to fit a line. */
const MIN_FIT_ZOOM = 10;
/** Room kept between a framed end and the visible edge, so the dot isn't clipped (dp). */
const FIT_MARGIN_X = 80;
const FIT_MARGIN_Y = 48;
/** The pin graphic (callout, head, stem) stands this tall above its tip (dp). */
const PIN_HEIGHT = 80;
/** Web Mercator: metres per dp at the equator at zoom 0 (256 dp tiles). */
const METRES_PER_DP_Z0 = 156_543.03;

export interface PathFrame {
  zoom: number;
  /** Where the pin's tip sits relative to the middle of the visible map (dp, +x right, +y down). */
  pinOffset: { x: number; y: number };
}

/**
 * Frames the straight line from `pin` to `other` (the user's dot) like a route preview: zoomed so
 * both ends fit, with the line's middle at the middle of the visible map. The map keeps `pin` as
 * its center, so this also says where on screen the pin has to stand. Never zooms in past the
 * usual focus zoom, so a close dot doesn't magnify the street.
 */
export function framePath(
  pin: GeoPoint,
  other: GeoPoint,
  visible: { width: number; height: number },
): PathFrame {
  const cosLat = Math.cos((pin.latitude * Math.PI) / 180);
  const eastMetres = (other.longitude - pin.longitude) * 111_320 * cosLat;
  const northMetres = (other.latitude - pin.latitude) * 110_540;
  // The pin rises above its tip, so less height is left to fit the line in.
  const usableWidth = Math.max(visible.width - 2 * FIT_MARGIN_X, 1);
  // On a short map strip (tall sheet below) the pin and margins could leave almost nothing; keep
  // at least a third of the strip, so a small north-south gap can't zoom the map out to a region.
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
  // The dot is (dx, dy) from the pin on screen; put their middle on the visible middle, nudged
  // down by half the pin's height so the pin graphic and the dot are balanced as a whole.
  const dx = eastMetres / metresPerDp;
  const dy = -northMetres / metresPerDp;
  return { zoom, pinOffset: { x: -dx / 2, y: -dy / 2 + PIN_HEIGHT / 2 } };
}

export interface CameraPadding {
  top: number;
  bottom: number;
}

/**
 * Tracks the map's center coordinate and eases the camera to new points,
 * queueing a move requested before the map style has finished loading.
 */
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

  /** Centers on `point` at the usual focus zoom, or at `zoom` (e.g. from `zoomToFit`). */
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
