import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import type { GeoPoint } from '@/lib/geo';

import { geocodeAddress, getCurrentPosition } from '../geocoding';
import { hasLocationAccess, requestLocationAccess } from '../location-access';
import type { MapPickerMode } from '../map-picker-route';

interface UsePickerLocationOptions {
  picker: MapPickerMode;
  animateTo: (point: GeoPoint, duration?: number) => void;
  /** Called when an edited address's coordinates are resolved from its text. */
  onAddressResolved: (point: GeoPoint) => void;
}

/**
 * Device-location side of the map picker: centers the map when it opens and
 * powers the "use my current location" button.
 */
export function usePickerLocation({
  picker,
  animateTo,
  onAddressResolved,
}: UsePickerLocationOptions) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // On open: center on the given place, or find the device for a new pin.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (picker.mode === 'pin') {
        // Placing a pin starts from where the customer is: ask now (the map still works without).
        const access = await requestLocationAccess();
        if (cancelled) return;
        setHasPermission(access === 'granted');
        if (access !== 'granted') return;
        const position = await getCurrentPosition((approx) => animateTo(approx, 400));
        if (!cancelled && position) animateTo(position, 600);
        return;
      }

      // Only check (never prompt) so the blue dot shows if already allowed.
      const granted = await hasLocationAccess();
      if (!cancelled) setHasPermission(granted);

      if (picker.region) {
        animateTo(picker.region, 400);
      } else if (picker.mode === 'edit' && picker.address) {
        const resolved = await geocodeAddress(picker.address);
        if (!cancelled && resolved) {
          onAddressResolved(resolved);
          animateTo(resolved, 400);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once on open; the picker params don't change for this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Asks for permission if needed and resolves the device position (null on failure). */
  const locateUser = async (): Promise<GeoPoint | null> => {
    if (isLocating) return null;
    setIsLocating(true);
    try {
      // Tapped on purpose: if the OS won't ask again, explain and offer Settings / turning it on.
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
