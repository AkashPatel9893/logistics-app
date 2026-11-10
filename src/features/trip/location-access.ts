import * as LegacyLocation from 'expo-location';
import { Location } from 'expo-location/next';
import { Linking, Platform } from 'react-native';

import { showLocationPrompt } from './location-prompt';

export type LocationAccess = 'granted' | 'denied' | 'blocked' | 'services-off';

/** Where location stands, without asking anything. */
export type LocationStatus = 'granted' | 'services-off' | 'not-asked' | 'blocked';

export interface LocationAccessOptions {
  /**
   * The customer just asked for something that needs location (e.g. "Use current location"):
   * when the system can't help any more, show the sheet that explains and offers the fix (turn
   * location on, open Settings). Without it, a refusal stays silent: used for automatic,
   * nice-to-have lookups that must not nag.
   */
  explain?: boolean;
  /**
   * Before the very first system prompt, show our own sheet saying why (as large apps do), so
   * the customer decides knowing what it is for. Only when the OS can still show its prompt.
   */
  prime?: boolean;
}

function openAppSettings() {
  Linking.openSettings().catch(() => {});
}

/** Current state, read-only: drives banners without triggering any dialog. */
export async function getLocationStatus(): Promise<LocationStatus> {
  if (!Location.hasLocationServicesEnabled()) return 'services-off';
  const permission = await Location.getForegroundPermissions().catch(() => null);
  if (permission?.status === 'granted') return 'granted';
  return permission && !permission.canAskAgain ? 'blocked' : 'not-asked';
}

export async function hasLocationAccess(): Promise<boolean> {
  return (await getLocationStatus()) === 'granted';
}

/**
 * Turns the phone's location on. Android has a one-tap system dialog for it; iOS can't be
 * switched from an app, so our sheet explains and links to Settings.
 */
export async function turnOnLocationServices(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      // Resolves only if the customer accepted; the OS reports the new state a moment later,
      // so don't re-check here or the flow stops and needs a second tap.
      await LegacyLocation.enableNetworkProviderAsync();
      return true;
    } catch {
      return false;
    }
  }
  if ((await showLocationPrompt('services-off')) === 'primary') openAppSettings();
  return false;
}

/**
 * Gets foreground location access at the moment it is needed: our explanation first (optional),
 * then the system prompt while the OS still allows it, and once it doesn't, the way out
 * (turn location on, Settings) when the customer asked for it.
 */
export async function requestLocationAccess(
  options: LocationAccessOptions = {},
): Promise<LocationAccess> {
  if (!Location.hasLocationServicesEnabled()) {
    if (!options.explain) return 'services-off';
    if (!(await turnOnLocationServices())) return 'services-off';
  }

  const permission = await Location.getForegroundPermissions().catch(() => null);
  if (permission?.status === 'granted') return 'granted';

  if (!permission || permission.canAskAgain) {
    if (options.prime && (await showLocationPrompt('ask')) !== 'primary') return 'denied';
    const answer = await Location.requestForegroundPermissions().catch(() => null);
    // Answered in the system dialog just now: respect it, no second dialog on top.
    return answer?.status === 'granted' ? 'granted' : 'denied';
  }

  // The OS won't show its prompt again ("Don't allow" twice / "Don't ask again").
  if (options.explain && (await showLocationPrompt('blocked')) === 'primary') openAppSettings();
  return 'blocked';
}
