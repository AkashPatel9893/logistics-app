import type { ImageSourcePropType } from 'react-native';

import { vehiclesEndpoints } from '@/data/mock';
import { VEHICLE_IMAGES } from './mock-data';

export interface RideOption {
  id: string;
  name: string;
  description: string;
  /** Minutes for a driver to reach the pickup point. */
  etaMinutes: number;
  /** Fallback fare shown when the trip distance is unknown. */
  price: number;
  baseFare: number;
  perKmRate: number;
  image: ImageSourcePropType;
}

export const RIDE_OPTIONS: RideOption[] = vehiclesEndpoints.rideOptionsEndpoint.data.map(
  (option) => ({
    ...option,
    image: VEHICLE_IMAGES[option.imageKey] ?? VEHICLE_IMAGES.bike,
  }),
);

// Orders persisted before the home grid and ride options shared one set of
// vehicle IDs still carry the old ride-option IDs.
const LEGACY_VEHICLE_IDS: Record<string, string> = {
  'two-wheeler': 'bike',
  'three-wheeler': 'pickup-truck',
  'e-rickshaw': 'e-rikshaw',
};

export function getRideOptionById(id: string): RideOption | undefined {
  const resolvedId = LEGACY_VEHICLE_IDS[id] ?? id;
  return RIDE_OPTIONS.find((option) => option.id === resolvedId);
}

// Straight-line distance understates real road distance; this factor keeps
// prototype fares in a believable range until a routing API prices trips.
const ROAD_DISTANCE_FACTOR = 1.3;
const MIN_BILLABLE_KM = 1;

/** Estimated road distance for a straight-line distance, rounded to 0.1 km. */
export function estimateRoadDistanceKm(straightLineKm: number): number {
  return Math.round(Math.max(MIN_BILLABLE_KM, straightLineKm * ROAD_DISTANCE_FACTOR) * 10) / 10;
}

/**
 * Prototype fare: base fare plus a per-km rate over the estimated road
 * distance. Falls back to the option's flat price when distance is unknown.
 * The backend becomes the source of truth for pricing once it exists.
 */
export function estimateFare(option: RideOption, roadDistanceKm: number | null): number {
  if (roadDistanceKm === null) return option.price;
  return Math.round(option.baseFare + option.perKmRate * roadDistanceKm);
}
