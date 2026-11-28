import { useEffect, useState } from 'react';

import type { GeoPoint } from '@/lib/geo';

import { peekResolvedPlace, reverseGeocodePlace, type ResolvedPlace } from '../geocoding';

const SETTLE_MS = 500;

/**
 * The address under the map pin. Looked up only once the map has stopped for half a second
 * (one lookup per spot, cached), so dragging around costs nothing.
 */
export function usePinAddress(center: GeoPoint | null, isMoving: boolean) {
  const [result, setResult] = useState<{ key: string; place: ResolvedPlace | null } | null>(null);
  const latitude = center?.latitude;
  const longitude = center?.longitude;
  const point = latitude != null && longitude != null ? { latitude, longitude } : null;
  const key = point ? `${latitude},${longitude}` : '';
  const cached = point ? peekResolvedPlace(point) : undefined;

  useEffect(() => {
    if (isMoving || latitude == null || longitude == null) return;
    const spot = { latitude, longitude };
    if (peekResolvedPlace(spot)) return;
    let live = true;
    const timer = setTimeout(() => {
      void reverseGeocodePlace(spot, '').then((resolved) => {
        if (live) {
          setResult({
            key: `${latitude},${longitude}`,
            place: resolved.label || resolved.address ? resolved : null,
          });
        }
      });
    }, SETTLE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [isMoving, latitude, longitude]);

  const settled = cached ?? (result?.key === key ? result.place : undefined);
  return {
    place: isMoving ? null : (settled ?? null),
    isLooking: isMoving || (point !== null && settled === undefined),
  };
}
