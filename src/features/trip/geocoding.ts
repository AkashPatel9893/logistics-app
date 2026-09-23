import * as Location from 'expo-location';

import type { GeoPoint } from '@/lib/geo';

/**
 * Device geocoding helpers (Apple/Android geocoder via expo-location — no
 * API key). The backend/places API replaces these once it exists.
 */

type ReverseGeocodeResult = Location.LocationGeocodedAddress;

/** "Name, Street" style label from a reverse-geocoded place. */
export function formatPlaceLabel(place: ReverseGeocodeResult | undefined): string {
  if (!place) return '';
  // Geocoders often return the street as the name too — don't print it twice.
  const parts = [place.name, place.street, place.city].filter(
    (part, index, all): part is string => Boolean(part) && all.indexOf(part) === index,
  );
  return parts.slice(0, 2).join(', ');
}

export async function geocodeAddress(text: string): Promise<GeoPoint | null> {
  try {
    const [match] = await Location.geocodeAsync(text);
    return match ? { latitude: match.latitude, longitude: match.longitude } : null;
  } catch {
    return null;
  }
}

/** Human-readable label for a coordinate, or `fallback` if it can't be resolved. */
export async function reverseGeocodeLabel(point: GeoPoint, fallback: string): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync(point);
    return formatPlaceLabel(place) || fallback;
  } catch {
    return fallback;
  }
}

export interface GeocodedSearchResult {
  name: string;
  address: string;
  region: GeoPoint;
}

/** Resolves free text typed in search to a single place, or null. */
export async function searchAddress(query: string): Promise<GeocodedSearchResult | null> {
  const region = await geocodeAddress(query);
  if (!region) return null;
  const address = await reverseGeocodeLabel(region, query);
  return { name: query, address, region };
}

export type LocationPermission = 'granted' | 'denied' | 'unavailable';

/** Checks (and optionally requests) foreground location permission. */
export async function ensureLocationPermission(request: boolean): Promise<LocationPermission> {
  if (!(await Location.hasServicesEnabledAsync())) return 'unavailable';
  let { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted' && request) {
    ({ status } = await Location.requestForegroundPermissionsAsync());
  }
  return status === 'granted' ? 'granted' : 'denied';
}

const WATCH_TIMEOUT_MS = 6_000;

// iOS can throw kCLErrorDomain 0 while CoreLocation is still acquiring a fix;
// watching the position until the first reading is the reliable fallback.
function waitForFirstPosition(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    let subscription: Location.LocationSubscription | null = null;
    const finish = (point: GeoPoint | null) => {
      clearTimeout(timer);
      subscription?.remove();
      resolve(point);
    };
    const timer = setTimeout(() => finish(null), WATCH_TIMEOUT_MS);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 1 },
      ({ coords }) => finish({ latitude: coords.latitude, longitude: coords.longitude }),
    )
      .then((sub) => {
        subscription = sub;
      })
      .catch(() => finish(null));
  });
}

/**
 * Current device position, reporting a quick cached fix first via
 * `onApproximate` when one exists. Assumes permission is already granted.
 */
export async function getCurrentPosition(
  onApproximate?: (point: GeoPoint) => void,
): Promise<GeoPoint | null> {
  const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
  if (lastKnown) {
    onApproximate?.({ latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude });
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  }).catch(() => null);
  if (current) return { latitude: current.coords.latitude, longitude: current.coords.longitude };

  return (
    (await waitForFirstPosition()) ??
    (lastKnown
      ? { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude }
      : null)
  );
}
