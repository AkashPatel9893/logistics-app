import { useEffect, useRef, useState } from 'react';

import { getCurrentPosition, reverseGeocodePlace } from '@/features/trip/geocoding';
import { hasLocationAccess, requestLocationAccess } from '@/features/trip/location-access';
import { useOnAppForeground } from '@/hooks/use-app-state';
import { useTripStore } from '@/stores';

let hasAskedForLocationOnHome = false;

export function hasAskedHomeLocation(): boolean {
  return hasAskedForLocationOnHome;
}

export function useHomeLocation() {
  const pickupLabel = useTripStore((s) => s.draft.pickupLabel);
  const pickupAddress = useTripStore((s) => s.draft.pickupAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const inFlightRef = useRef(false);
  const unmountedRef = useRef(false);

  const refreshLocation = () => setRefreshCount((count) => count + 1);
  useOnAppForeground(refreshLocation);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (pickupLabel || inFlightRef.current) return;

    inFlightRef.current = true;
    (async () => {
      setIsLocating(true);
      try {
        let granted = await hasLocationAccess();
        if (!granted && !hasAskedForLocationOnHome) {
          hasAskedForLocationOnHome = true;
          granted = (await requestLocationAccess()) === 'granted';
        }
        if (unmountedRef.current || !granted) return;

        const pos = await getCurrentPosition().catch(() => null);
        if (unmountedRef.current || !pos) return;

        const place = await reverseGeocodePlace(pos, 'Current location');
        const cancelled = unmountedRef.current;
        if (cancelled || useTripStore.getState().draft.pickupLabel) return;

        useTripStore.getState().setPickup(place.label, pos, place.address);
      } catch {
      } finally {
        inFlightRef.current = false;
        if (!unmountedRef.current) setIsLocating(false);
      }
    })();
  }, [pickupLabel, refreshCount]);

  return { pickupLabel, pickupAddress, isLocating, refreshLocation };
}
