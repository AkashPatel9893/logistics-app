import { LegacyLocation, Location } from '@/lib/location';
import { Linking, Platform } from '@/lib/native';
import { showLocationPrompt } from '@/stores';

export type LocationAccess = 'granted' | 'denied' | 'blocked' | 'services-off';
export type LocationStatus = 'granted' | 'services-off' | 'not-asked' | 'blocked';

export interface LocationAccessOptions {
  explain?: boolean;
}

const INSTANT_REFUSAL_MS = 400;

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
      return true;
    } catch {
      return false;
    }
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

  const askedAt = Date.now();
  const answer = await Location.requestForegroundPermissions().catch(() => null);
  if (answer?.status === 'granted') return 'granted';
  if (answer && !answer.canAskAgain) {
    // Instant denial means the OS skipped the dialog because permission is permanently blocked.
    const wasInstant = Date.now() - askedAt < INSTANT_REFUSAL_MS;
    if (options.explain && wasInstant) openAppSettings();
    return 'blocked';
  }
  return 'denied';
}
