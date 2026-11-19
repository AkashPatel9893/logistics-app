import { useEffect, useState } from 'react';

import { useTripStore } from '@/stores';

import { getCurrentPosition, reverseGeocodePlace } from '../geocoding';
import { requestLocationAccess } from '../location-access';
import { isServiceable } from '../serviceability';

export function useAutoFillCurrentPickup(isPickupMode: boolean) {
  const [isCurrentLocationUnserved, setIsCurrentLocationUnserved] = useState(false);

  useEffect(() => {
    const isPickupChosen = () => {
      const { pickupRegion, isPickupCarriedOver } = useTripStore.getState().draft;
      return Boolean(pickupRegion) && !isPickupCarriedOver;
    };
    if (isPickupMode || isPickupChosen()) return;

    let cancelled = false;
    (async () => {
      const access = await requestLocationAccess();
      if (cancelled || access !== 'granted') return;
      const position = await getCurrentPosition();
      if (cancelled || !position) return;
      if (!(await isServiceable(position))) {
        if (!cancelled) setIsCurrentLocationUnserved(true);
        return;
      }
      const place = await reverseGeocodePlace(position, 'Current location');
      if (cancelled || isPickupChosen()) return;
      useTripStore.getState().setPickup(place.label, position, place.address);
    })();
    return () => {
      cancelled = true;
    };
  }, [isPickupMode]);

  return isCurrentLocationUnserved;
}
