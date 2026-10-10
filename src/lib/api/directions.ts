import type { GeoPoint } from './models';

const OLA_API_KEY = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY ?? '';
const DIRECTIONS_URL = 'https://api.olamaps.io/routing/v1/directions';

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
  /** Road route from `from` to `to` through `via`, from Ola Maps; throws when none is available. */
  getRoadRoute: async (
    from: GeoPoint,
    to: GeoPoint,
    via: GeoPoint[] = [],
    signal?: AbortSignal,
  ): Promise<GeoPoint[]> => {
    const params = new URLSearchParams({
      origin: `${from.latitude},${from.longitude}`,
      destination: `${to.latitude},${to.longitude}`,
      api_key: OLA_API_KEY,
    });
    if (via.length > 0) {
      params.set('waypoints', via.map((p) => `${p.latitude},${p.longitude}`).join('|'));
    }
    const response = await fetch(`${DIRECTIONS_URL}?${params.toString()}`, {
      method: 'POST',
      signal,
    });
    if (!response.ok) throw new Error(`Directions request failed (${response.status})`);
    const body = (await response.json()) as { routes?: { overview_polyline?: string }[] };
    const path = decodePolyline(body.routes?.[0]?.overview_polyline ?? '');
    if (path.length < 2) throw new Error('No road route found');
    return path;
  },
};
