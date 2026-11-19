import { useEffect, useRef, useState } from 'react';

import type { GeoPoint } from '@/lib/geo';
import { Alert } from '@/lib/native';

import { geocodeAddress, getCurrentPosition } from '../geocoding';
import { hasLocationAccess, requestLocationAccess } from '../location-access';
import type { MapPickerMode } from '../map-picker-route';

interface UsePickerLocationOptions {
  picker: MapPickerMode;
  animateTo: (point: GeoPoint, duration?: number) => void;
  onAddressResolved: (point: GeoPoint) => void;
}

export function usePickerLocation({
  picker,
  animateTo,
  onAddressResolved,
}: UsePickerLocationOptions) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const latestRef = useRef({ picker, animateTo, onAddressResolved });
  useEffect(() => {
    latestRef.current = { picker, animateTo, onAddressResolved };
  });

  useEffect(() => {
    let cancelled = false;
    const initial = latestRef.current.picker;

    (async () => {
      if (initial.mode === 'pin') {
        const access = await requestLocationAccess();
        if (cancelled) return;
        setHasPermission(access === 'granted');
        if (access !== 'granted') return;
        const position = await getCurrentPosition((approx) =>
          latestRef.current.animateTo(approx, 400),
        );
        if (!cancelled && position) latestRef.current.animateTo(position, 600);
        return;
      }

      const granted = await hasLocationAccess();
      if (!cancelled) setHasPermission(granted);

      if (initial.region) {
        latestRef.current.animateTo(initial.region, 400);
      } else if (initial.mode === 'edit' && initial.address) {
        const resolved = await geocodeAddress(initial.address);
        if (!cancelled && resolved) {
          latestRef.current.onAddressResolved(resolved);
          latestRef.current.animateTo(resolved, 400);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const locateUser = async (): Promise<GeoPoint | null> => {
    if (isLocating) return null;
    setIsLocating(true);
    try {
      const access = await requestLocationAccess({ explain: true });
      if (access !== 'granted') return null;
      setHasPermission(true);
      const position = await getCurrentPosition();
      if (!position) Alert.alert('Location unavailable', 'Unable to get your current location.');
      return position;
    } finally {
      setIsLocating(false);
    }
  };

  return { hasPermission, isLocating, locateUser };
}
