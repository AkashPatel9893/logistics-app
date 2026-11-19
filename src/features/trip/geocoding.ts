import { placesApi } from '@/lib/api/places';
import type { GeoPoint } from '@/lib/geo';
import {
  LegacyLocation,
  Location,
  LocationProfile,
  type LocationGeocodedAddress,
} from '@/lib/location';

type ReverseGeocodeResult = LocationGeocodedAddress;

const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]*$/;

export function formatPlaceLabel(place: ReverseGeocodeResult | undefined): string {
  if (!place) return '';
  const parts: string[] = [];
  for (const part of [place.name, place.street, place.city]) {
    if (!part || PLUS_CODE.test(part)) continue;
    const lower = part.toLowerCase();
    if (parts.some((kept) => kept.toLowerCase().includes(lower))) continue;
    parts.push(part);
  }
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

export async function resolvePlaceCoordinates(place: {
  id: string;
  name: string;
  address: string;
  location: GeoPoint | null;
}): Promise<GeoPoint | null> {
  if (place.location) return place.location;
  if (place.id.startsWith('place:')) {
    const resolved = await placesApi.getPlaceLocation(place.id);
    if (resolved) return resolved;
  }
  return geocodeAddress(place.address || place.name);
}

export async function reverseGeocodeLabel(point: GeoPoint, fallback: string): Promise<string> {
  try {
    const [place] = await LegacyLocation.reverseGeocodeAsync(point);
    return formatPlaceLabel(place) || fallback;
  } catch {
    return fallback;
  }
}

export interface ResolvedPlace {
  label: string;
  address: string;
}

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

export async function searchAddress(query: string): Promise<GeocodedSearchResult | null> {
  const region = await geocodeAddress(query);
  if (!region) return null;
  const address = await reverseGeocodeLabel(region, query);
  return { name: query, address, region };
}

const WATCH_TIMEOUT_MS = 6_000;

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

let lastKnownPosition: GeoPoint | null = null;

function remember(point: GeoPoint | null): GeoPoint | null {
  if (point) lastKnownPosition = point;
  return point;
}

export async function getLastKnownPosition(): Promise<GeoPoint | null> {
  if (lastKnownPosition) return lastKnownPosition;
  try {
    const cached = await LegacyLocation.getLastKnownPositionAsync();
    return cached
      ? remember({ latitude: cached.coords.latitude, longitude: cached.coords.longitude })
      : null;
  } catch {
    return null;
  }
}

export function peekLastKnownPosition(): GeoPoint | null {
  return lastKnownPosition;
}

export async function getCurrentPosition(
  onApproximate?: (point: GeoPoint) => void,
): Promise<GeoPoint | null> {
  try {
    const position = await Location.getPosition({
      maxCachedAge: 120,
      timeout: 6,
    });

    if (position?.coordinates?.latitude != null && position?.coordinates?.longitude != null) {
      const point = {
        latitude: position.coordinates.latitude,
        longitude: position.coordinates.longitude,
      };
      onApproximate?.(point);
      return remember(point);
    }
  } catch {}

  return remember(await waitForFirstPosition());
}
