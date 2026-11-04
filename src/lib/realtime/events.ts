import type { GeoPoint } from '@/lib/api/models';

/**
 * Frames the backend pushes on `WS /ws/trips/{trip_id}`: a `snapshot` first (same shape as
 * `GET /trips/{id}/tracking`), then live `location`, `eta` and `trip_status` events.
 */
export type TripSocketEvent =
  | {
      type: 'snapshot';
      driver_location: {
        latitude: number | string;
        longitude: number | string;
        recorded_at: string;
        stale: boolean;
      } | null;
    }
  | { type: 'location'; latitude: number; longitude: number; recorded_at: string }
  | { type: 'eta'; eta_seconds: number; distance_meters: number }
  | { type: 'trip_status'; status: string }
  | { type: 'pong' }
  | { type: 'error'; code: string };

/** What the screens consume from the socket. */
export type TripLiveUpdate =
  | { kind: 'position'; position: GeoPoint; recordedAt: string; stale: boolean }
  | { kind: 'status'; status: string };
