import type { ImageSourcePropType } from 'react-native';

import { vehiclesEndpoints } from '@/data/mock';
import { VEHICLE_IMAGES } from './mock-data';

export interface RideOption {
  id: string;
  name: string;
  description: string;
  etaMinutes: number;
  price: number;
  image: ImageSourcePropType;
}

export const RIDE_OPTIONS: RideOption[] = vehiclesEndpoints.rideOptionsEndpoint.data.map(
  (option) => ({
    ...option,
    image: VEHICLE_IMAGES[option.imageKey] ?? VEHICLE_IMAGES.bike,
  }),
);

export function getRideOptionById(id: string): RideOption | undefined {
  return RIDE_OPTIONS.find((option) => option.id === id);
}
