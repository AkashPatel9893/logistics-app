import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import type { GeoPoint } from '@/lib/geo';

import { ensureLocationPermission, geocodeAddress, getCurrentPosition } from '../geocoding';
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
        const permission = await ensureLocationPermission(true);
        if (cancelled) return;
        setHasPermission(permission === 'granted');
        if (permission !== 'granted') return;
        const position = await getCurrentPosition((approx) => animateTo(approx, 400));
        if (!cancelled && position) animateTo(position, 600);
        return;
      }

      // Only check (never prompt) so the blue dot shows if already allowed.
      const permission = await ensureLocationPermission(false).catch(() => 'denied' as const);
      if (!cancelled) setHasPermission(permission === 'granted');

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
      const permission = await ensureLocationPermission(true);
      if (permission !== 'granted') {
        Alert.alert(
          permission === 'unavailable' ? 'Location services are off' : 'Location permission needed',
          permission === 'unavailable'
            ? 'Turn on Location Services in Settings to use your current location.'
            : 'Allow location access to use your current location.',
        );
        return null;
      }
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
