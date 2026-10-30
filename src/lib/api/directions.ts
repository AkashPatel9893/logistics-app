import { env } from '@/env';
import type { GeoPoint } from './models';

const GOOGLE_API_KEY = env.GOOGLE_MAPS_API_KEY;
const GOOGLE_DIRECTIONS_URL = `${env.GOOGLE_MAPS_BASE_URL}/maps/api/directions/json`;

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
  /** Road route from `from` to `to` through `via` using Google Maps Directions. */
  getRoadRoute: async (
    from: GeoPoint,
    to: GeoPoint,
    via: GeoPoint[] = [],
    signal?: AbortSignal,
  ): Promise<GeoPoint[]> => {
    // 1. Try Google Maps Directions API if key exists
    if (GOOGLE_API_KEY) {
      try {
        const params = new URLSearchParams({
          origin: `${from.latitude},${from.longitude}`,
          destination: `${to.latitude},${to.longitude}`,
          key: GOOGLE_API_KEY,
        });
        if (via.length > 0) {
          params.set('waypoints', via.map((p) => `${p.latitude},${p.longitude}`).join('|'));
        }
        const res = await fetch(`${GOOGLE_DIRECTIONS_URL}?${params.toString()}`, { signal });
        if (res.ok) {
          const data = (await res.json()) as {
            routes?: { overview_polyline?: { points?: string } }[];
          };
          const points = data.routes?.[0]?.overview_polyline?.points;
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
