import type { ImageSourcePropType } from 'react-native';

import { accountEndpoints, ordersEndpoints, vehiclesEndpoints } from '@/data/mock';
import type { VehicleOption } from './types';

export const VEHICLE_IMAGES: Record<string, ImageSourcePropType> = {
  bike: require('@/assets/images/vehicles/bike.png'),
  'mini-truck': require('@/assets/images/vehicles/mini-truck.png'),
  'large-truck': require('@/assets/images/vehicles/large-truck.png'),
  'e-rikshaw': require('@/assets/images/vehicles/e-rikshaw.png'),
  'pickup-truck': require('@/assets/images/vehicles/pickup-truck.png'),
};

export const FEATURED_VEHICLES: VehicleOption[] =
  vehiclesEndpoints.vehiclesEndpoint.data.featured.map((v) => ({
    ...v,
    category: v.category as 'featured',
    image: VEHICLE_IMAGES[v.imageKey] ?? VEHICLE_IMAGES.bike,
  }));

export const STANDARD_VEHICLES: VehicleOption[] =
  vehiclesEndpoints.vehiclesEndpoint.data.standard.map((v) => ({
    ...v,
    category: v.category as 'standard',
    image: VEHICLE_IMAGES[v.imageKey] ?? VEHICLE_IMAGES.bike,
  }));

export const ACCOUNT_MOCK_DATA = accountEndpoints.accountSummaryEndpoint.data;

export const TRACKING_MOCK_DATA = ordersEndpoints.orderTrackingEndpoint.data;
