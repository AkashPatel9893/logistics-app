import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { env } from '@/env';
import type { GeoPoint } from './models';

const GOOGLE_API_KEY = env.GOOGLE_MAPS_API_KEY;
/** Keys restricted to an app are only accepted when the request names that app. */
const APP_RESTRICTION_HEADERS: Record<string, string> =
  Platform.OS === 'ios' && Constants.expoConfig?.ios?.bundleIdentifier
    ? { 'X-Ios-Bundle-Identifier': Constants.expoConfig.ios.bundleIdentifier }
    : {};
const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/** Decodes an encoded polyline (precision 5) into coordinates. */
function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const readDelta = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += readDelta();
    longitude += readDelta();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

export const directionsApi = {
  /** Road route from `from` to `to` through `via` using the Google Routes API. */
  getRoadRoute: async (
    from: GeoPoint,
    to: GeoPoint,
    via: GeoPoint[] = [],
    signal?: AbortSignal,
  ): Promise<GeoPoint[]> => {
    // 1. Google Routes API (the legacy Directions API is not enabled for new projects)
    if (GOOGLE_API_KEY) {
      try {
        const toWaypoint = (p: GeoPoint) => ({
          location: { latLng: { latitude: p.latitude, longitude: p.longitude } },
        });
        const res = await fetch(GOOGLE_ROUTES_URL, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            ...APP_RESTRICTION_HEADERS,
            'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
          },
          body: JSON.stringify({
            origin: toWaypoint(from),
            destination: toWaypoint(to),
            intermediates: via.map(toWaypoint),
            travelMode: 'DRIVE',
            // The line only needs the road shape; ETAs come from the backend. Skipping live
            // traffic keeps each call on the cheaper Routes billing tier.
            routingPreference: 'TRAFFIC_UNAWARE',
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            routes?: { polyline?: { encodedPolyline?: string } }[];
          };
          const points = data.routes?.[0]?.polyline?.encodedPolyline;
          if (points) {
            const decoded = decodePolyline(points);
            if (decoded.length >= 2) return decoded;
          }
        }
      } catch {
        // Fall back to straight line
      }
    }

    // 2. Fallback to straight-line connection
    return [from, ...via, to];
  },
};
