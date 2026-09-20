export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** [west, south, east, north] — the shape MapLibre's `Camera` bounds prop expects. */
export type GeoBounds = [west: number, south: number, east: number, north: number];

/**
 * Computes the bounding box around every point on a route, with a small
 * degree-based margin so endpoints don't sit flush against the map edge.
 * Feed this to `OlaMapCamera`'s `bounds` so the camera fits (zooms/pans to
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
