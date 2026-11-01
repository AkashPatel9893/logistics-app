export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** [west, south, east, north] bounding box for map camera fitting. */
export type GeoBounds = [west: number, south: number, east: number, north: number];

/**
 * Computes the bounding box around every point on a route, with a small
 * degree-based margin so endpoints don't sit flush against the map edge.
 * Feed this to `AppMapCamera`'s `bounds` so the camera fits (zooms/pans to
 * show) the whole route instead of a fixed, possibly-too-tight zoom level.
 */
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  return {
    latitude: lerp(a.latitude, b.latitude, t),
    longitude: lerp(a.longitude, b.longitude, t),
  };
}

/** Offsets a point by roughly `km` kilometers toward the northeast — used to synthesize a
 * plausible "driver is nearby" starting position when no real courier location exists. */
export function offsetPoint(point: GeoPoint, km: number): GeoPoint {
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos((point.latitude * Math.PI) / 180);
  return {
    latitude: point.latitude + km / kmPerDegreeLat,
    longitude: point.longitude + km / kmPerDegreeLng,
  };
}

/**
 * Walks a multi-point path and returns the point at fractional `progress` (0-1) along its
 * total length, distributing progress by straight-line segment distance rather than by
 * point count, so uneven segment lengths don't distort perceived speed.
 */
export function interpolateAlongPath(path: GeoPoint[], progress: number): GeoPoint {
  if (path.length === 0) return { latitude: 0, longitude: 0 };
  if (path.length === 1) return path[0];

  const clamped = Math.max(0, Math.min(1, progress));
  const segmentLengths = path.slice(1).map((point, i) => {
    const prev = path[i];
    return Math.hypot(point.latitude - prev.latitude, point.longitude - prev.longitude);
  });
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  if (totalLength === 0) return path[0];

  const targetDistance = clamped * totalLength;
  let travelled = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i];
    if (travelled + segmentLength >= targetDistance) {
      const segmentT = segmentLength === 0 ? 0 : (targetDistance - travelled) / segmentLength;
      return lerpPoint(path[i], path[i + 1], segmentT);
    }
    travelled += segmentLength;
  }
  return path[path.length - 1];
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle (haversine) distance between two points, in kilometers. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * The part of `path` still ahead of `point`. `point` is projected onto the nearest path
 * segment (not just the nearest vertex, which on long straight roads can be far away), so the
 * remaining line starts exactly where the vehicle is. Pass `fromIndex` (the `index` of the previous
 * result) to search only forward: a vehicle never moves back along its route, so GPS jitter or a
 * parallel road cannot make it jump to another part of the line. `offPathKm` is the distance from
 * `point` to that segment, `snapped` the projected point, for drawing the vehicle on the road.
 */
export function remainingPath(
  path: GeoPoint[],
  point: GeoPoint,
  fromIndex = 0,
): { path: GeoPoint[]; offPathKm: number; snapped: GeoPoint; index: number } {
  if (path.length < 2) return { path: [point, ...path], offPathKm: 0, snapped: point, index: 0 };
  // Local flat approximation (km per degree) is accurate enough at city scale.
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

/** Total straight-line length of a multi-point path, in kilometers. */
export function pathDistanceKm(path: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distanceKm(path[i - 1], path[i]);
  }
  return total;
}

/** Compass bearing from `from` to `to`, in degrees clockwise from north (0–360). */
export function bearingDegrees(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Direction of travel along `path`, which starts at the vehicle: the bearing to the first vertex
 * at least `lookAheadKm` away, so tiny segments and GPS wobble do not spin the icon.
 * Null when the path has nothing ahead.
 */
export function headingAlongPath(path: GeoPoint[], lookAheadKm = 0.03): number | null {
  if (path.length < 2) return null;
  const start = path[0];
  const target = path.slice(1).find((point) => distanceKm(start, point) >= lookAheadKm);
  const ahead = target ?? path[path.length - 1];
  return distanceKm(start, ahead) < 0.002 ? null : bearingDegrees(start, ahead);
}

/** Rough bounding box of India; the app only books deliveries there. */
export const isInServiceArea = ({ latitude, longitude }: GeoPoint) =>
  latitude >= 6 && latitude <= 37.5 && longitude >= 68 && longitude <= 98;

export const NOT_SERVICEABLE_TITLE = 'Sorry';
export const notServiceableMessage = (kind: 'pickup' | 'drop' | 'stop') =>
  `Oops! We currently don't service your ${kind} location. Please select different location`;
