export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type GeoBounds = [west: number, south: number, east: number, north: number];

export function computeBounds(points: GeoPoint[], marginDegrees = 0.01): GeoBounds {
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  return [
    Math.min(...longitudes) - marginDegrees,
    Math.min(...latitudes) - marginDegrees,
    Math.max(...longitudes) + marginDegrees,
    Math.max(...latitudes) + marginDegrees,
  ];
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function remainingPath(
  path: GeoPoint[],
  point: GeoPoint,
  fromIndex = 0,
): { path: GeoPoint[]; offPathKm: number; snapped: GeoPoint; index: number } {
  if (path.length < 2) return { path: [point, ...path], offPathKm: 0, snapped: point, index: 0 };
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((point.latitude * Math.PI) / 180);
  let best = { index: 0, t: 0, km: Infinity };
  for (let i = Math.min(Math.max(fromIndex, 0), path.length - 2); i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const abx = (b.longitude - a.longitude) * kmPerLng;
    const aby = (b.latitude - a.latitude) * kmPerLat;
    const apx = (point.longitude - a.longitude) * kmPerLng;
    const apy = (point.latitude - a.latitude) * kmPerLat;
    const lengthSq = abx * abx + aby * aby;
    const t = lengthSq === 0 ? 0 : Math.min(Math.max((apx * abx + apy * aby) / lengthSq, 0), 1);
    const km = Math.hypot(apx - t * abx, apy - t * aby);
    if (km < best.km) best = { index: i, t, km };
  }
  const from = path[best.index];
  const to = path[best.index + 1];
  const snapped = {
    latitude: from.latitude + (to.latitude - from.latitude) * best.t,
    longitude: from.longitude + (to.longitude - from.longitude) * best.t,
  };
  return {
    path: [snapped, ...path.slice(best.index + 1)],
    offPathKm: best.km,
    snapped,
    index: best.index,
  };
}

export function pathDistanceKm(path: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distanceKm(path[i - 1], path[i]);
  }
  return total;
}

function bearingDegrees(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function headingAlongPath(path: GeoPoint[], lookAheadKm = 0.03): number | null {
  if (path.length < 2) return null;
  const start = path[0];
  const target = path.slice(1).find((point) => distanceKm(start, point) >= lookAheadKm);
  const ahead = target ?? path[path.length - 1];
  return distanceKm(start, ahead) < 0.002 ? null : bearingDegrees(start, ahead);
}

export const isInServiceArea = ({ latitude, longitude }: GeoPoint) =>
  latitude >= 6 && latitude <= 37.5 && longitude >= 68 && longitude <= 98;
