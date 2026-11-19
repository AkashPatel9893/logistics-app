import { useEffect, useState } from 'react';

import {
  getLocationStatus,
  requestLocationAccess,
  type LocationStatus,
} from '@/features/trip/location-access';
import { useOnAppForeground } from '@/hooks/use-app-state';

import { hasAskedHomeLocation } from './use-home-location';

export type LocationIssue = 'services-off' | 'permission' | null;

export function useLocationStatus(trigger?: unknown) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useOnAppForeground(() => setRefreshTick((tick) => tick + 1));

  useEffect(() => {
    let cancelled = false;
    getLocationStatus().then((status) => {
      if (!cancelled) setLocationStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [trigger, refreshTick]);

  const fixLocation = async (onGranted?: () => void) => {
    const access = await requestLocationAccess({ explain: true });
    setLocationStatus(await getLocationStatus());
    if (access === 'granted') onGranted?.();
  };

  const locationIssue: LocationIssue =
    locationStatus === 'services-off'
      ? 'services-off'
      : locationStatus === 'blocked' || (locationStatus === 'not-asked' && hasAskedHomeLocation())
        ? 'permission'
        : null;

  return { locationIssue, fixLocation };
}
