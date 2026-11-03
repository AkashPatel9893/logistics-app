import * as LegacyLocation from 'expo-location';
import { Location, LocationProfile } from 'expo-location/next';

import type { GeoPoint } from '@/lib/geo';

/**
 * Device geocoding helpers (Apple/Android geocoder via expo-location — no
 * API key). The backend/places API replaces these once it exists.
 */

type ReverseGeocodeResult = LegacyLocation.LocationGeocodedAddress;

/** Android's geocoder names unnamed spots with a Plus Code ("J9FG+G3P"), which means nothing to a person. */
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]*$/;

/** "Name, Street" style label from a reverse-geocoded place. */
export function formatPlaceLabel(place: ReverseGeocodeResult | undefined): string {
  if (!place) return '';
  // Geocoders often return the street as the name too — don't print it twice.
  const parts = [place.name, place.street, place.city].filter(
    (part, index, all): part is string =>
      Boolean(part) && all.indexOf(part) === index && !PLUS_CODE.test(part ?? ''),
  );
  return parts.slice(0, 2).join(', ');
}

export async function geocodeAddress(text: string): Promise<GeoPoint | null> {
  try {
    const [match] = await LegacyLocation.geocodeAsync(text);
    return match ? { latitude: match.latitude, longitude: match.longitude } : null;
  } catch {
    return null;
  }
}

/** Human-readable label for a coordinate, or `fallback` if it can't be resolved. */
export async function reverseGeocodeLabel(point: GeoPoint, fallback: string): Promise<string> {
  try {
    const [place] = await LegacyLocation.reverseGeocodeAsync(point);
    return formatPlaceLabel(place) || fallback;
  } catch {
    return fallback;
  }
}

export interface ResolvedPlace {
  /** Short place name, e.g. "Barton Centre, MG Road". */
  label: string;
  /** Wider area shown under it, e.g. "Bengaluru, Karnataka, India". */
  address: string;
}

/** Place name plus its area line for a coordinate; `fallback` names it when unresolved. */
export async function reverseGeocodePlace(
  point: GeoPoint,
  fallback: string,
): Promise<ResolvedPlace> {
  try {
    const [place] = await LegacyLocation.reverseGeocodeAsync(point);
    const area = [place?.district, place?.city, place?.region, place?.country].filter(
      (part, index, all): part is string => Boolean(part) && all.indexOf(part) === index,
    );
    return { label: formatPlaceLabel(place) || fallback, address: area.join(', ') };
  } catch {
    return { label: fallback, address: '' };
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

/** Checks (and optionally requests) foreground location permission using expo-location/next. */
export async function ensureLocationPermission(request: boolean): Promise<LocationPermission> {
  const enabled = Location.hasLocationServicesEnabled();
  if (!enabled) return 'unavailable';

  let perm = await Location.getForegroundPermissions().catch(() => null);
  if (perm?.status !== 'granted' && request) {
    perm = await Location.requestForegroundPermissions().catch(() => null);
  }
  return perm?.status === 'granted' ? 'granted' : 'denied';
}

const WATCH_TIMEOUT_MS = 6_000;

// Watching the position until the first reading is the reliable fallback.
function waitForFirstPosition(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    let handle: { dispose: () => void } | null = null;
    const timer = setTimeout(() => {
      handle?.dispose();
      resolve(null);
    }, WATCH_TIMEOUT_MS);

    try {
      handle = Location.watchPosition({
        profile: LocationProfile.AUTOMOTIVE_NAVIGATION,
        onPosition: (pos) => {
          clearTimeout(timer);
          handle?.dispose();
          if (pos.coordinates?.latitude != null && pos.coordinates?.longitude != null) {
            resolve({
              latitude: pos.coordinates.latitude,
              longitude: pos.coordinates.longitude,
            });
          } else {
            resolve(null);
          }
        },
        onError: () => {
          clearTimeout(timer);
          handle?.dispose();
          resolve(null);
        },
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/**
 * Current device position using expo-location/next, reporting a quick cached fix first
 * via `onApproximate` when one exists. Assumes permission is already granted.
 */
export async function getCurrentPosition(
  onApproximate?: (point: GeoPoint) => void,
): Promise<GeoPoint | null> {
  try {
    const position = await Location.getPosition({
      maxCachedAge: 120, // 2 minutes
      timeout: 6,
    });

    if (position?.coordinates?.latitude != null && position?.coordinates?.longitude != null) {
      const point = {
        latitude: position.coordinates.latitude,
        longitude: position.coordinates.longitude,
      };
      onApproximate?.(point);
      return point;
    }
  } catch {
    // Fall back to watching for first fix
  }

  return await waitForFirstPosition();
}
