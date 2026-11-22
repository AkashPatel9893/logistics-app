import { LegacyLocation, Location } from '@/lib/location';
import { Linking, Platform } from '@/lib/native';
import { showLocationPrompt } from '@/stores';

export type LocationAccess = 'granted' | 'denied' | 'blocked' | 'services-off';
export type LocationStatus = 'granted' | 'services-off' | 'not-asked' | 'blocked';

export interface LocationAccessOptions {
  explain?: boolean;
}

function openAppSettings() {
  Linking.openSettings().catch(() => {});
}

export async function getLocationStatus(): Promise<LocationStatus> {
  if (!Location.hasLocationServicesEnabled()) return 'services-off';
  const permission = await Location.getForegroundPermissions().catch(() => null);
  if (permission?.status === 'granted') return 'granted';
  // Only count an explicit denial with !canAskAgain as blocked; Android may report !canAskAgain before first ask.
  return permission?.status === 'denied' && !permission.canAskAgain ? 'blocked' : 'not-asked';
}

export async function hasLocationAccess(): Promise<boolean> {
  return (await getLocationStatus()) === 'granted';
}

export async function turnOnLocationServices(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await LegacyLocation.enableNetworkProviderAsync();
      if (Location.hasLocationServicesEnabled()) return true;
    } catch {}
  }
  if ((await showLocationPrompt('services-off')) === 'primary') openAppSettings();
  return false;
}

export async function requestLocationAccess(
  options: LocationAccessOptions = {},
): Promise<LocationAccess> {
  if (!Location.hasLocationServicesEnabled()) {
    if (!options.explain) return 'services-off';
    if (!(await turnOnLocationServices())) return 'services-off';
  }

  const permission = await Location.getForegroundPermissions().catch(() => null);
  if (permission?.status === 'granted') return 'granted';
  if (permission?.status === 'denied' && !permission.canAskAgain) {
    if (options.explain) openAppSettings();
    return 'blocked';
  }

  const answer = await Location.requestForegroundPermissions().catch(() => null);
  if (answer?.status === 'granted') return 'granted';
  if (answer && !answer.canAskAgain) return 'blocked';
  return 'denied';
}
