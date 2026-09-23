import type { ImageSourcePropType } from 'react-native';

/**
 * Vehicle artwork bundled with the app, keyed by the API's `imageKey`.
 * (A production API would return image URLs instead.)
 */
const VEHICLE_IMAGES: Record<string, ImageSourcePropType> = {
  bike: require('@/assets/images/vehicles/bike.png'),
  'mini-truck': require('@/assets/images/vehicles/mini-truck.png'),
  'large-truck': require('@/assets/images/vehicles/large-truck.png'),
  'e-rikshaw': require('@/assets/images/vehicles/e-rikshaw.png'),
  'pickup-truck': require('@/assets/images/vehicles/pickup-truck.png'),
};

export function getVehicleImage(imageKey: string): ImageSourcePropType {
  return VEHICLE_IMAGES[imageKey] ?? VEHICLE_IMAGES.bike;
}

/** Illustrative route for the booking map when an address has no coordinates. */
export const PREVIEW_FALLBACK_ROUTE = [
  { latitude: 28.6385, longitude: 77.2405 },
  { latitude: 28.635, longitude: 77.239 },
  { latitude: 28.6317, longitude: 77.2415 },
  { latitude: 28.6321, longitude: 77.2455 },
  { latitude: 28.629, longitude: 77.248 },
];
