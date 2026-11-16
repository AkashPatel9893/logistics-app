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
}

/** A system prompt that comes back faster than a person can answer never reached the screen. */
const INSTANT_REFUSAL_MS = 400;

function openAppSettings() {
  Linking.openSettings().catch(() => {});
}

/** Current state, read-only: drives banners without triggering any dialog. */
export async function getLocationStatus(): Promise<LocationStatus> {
  if (!Location.hasLocationServicesEnabled()) return 'services-off';
  const permission = await Location.getForegroundPermissions().catch(() => null);
  if (permission?.status === 'granted') return 'granted';
  // `canAskAgain` can read false before the very first request on Android, so only a real
  // denial counts as blocked.
  return permission?.status === 'denied' && !permission.canAskAgain ? 'blocked' : 'not-asked';
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
 * Gets foreground location access at the moment it is needed: the system prompt directly while the OS still allows it, and once it doesn't, the way out
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

  // Always try the system prompt first: the OS shows it whenever it still can, and refuses
  // instantly when it can't. (`canAskAgain` alone is unreliable before the first request.)
  const askedAt = Date.now();
  const answer = await Location.requestForegroundPermissions().catch(() => null);
  if (answer?.status === 'granted') return 'granted';
  if (answer && !answer.canAskAgain) {
    // Refused instantly = the OS showed no prompt, so only Settings can fix it: go straight
    // there when the customer asked for location. A slow refusal is the customer tapping
    // "Don't allow" just now: respect it.
    const wasInstant = Date.now() - askedAt < INSTANT_REFUSAL_MS;
    if (options.explain && wasInstant) openAppSettings();
    return 'blocked';
  }
  return 'denied';
}
