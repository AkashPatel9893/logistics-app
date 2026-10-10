import type { ImageSourcePropType } from 'react-native';

/** The only vehicle picture bundled with the app, used when the backend sends none. */
const FALLBACK_VEHICLE_IMAGE: ImageSourcePropType = require('@/assets/images/vehicles/mini-truck.png');

/** The backend's picture for a vehicle, or the bundled fallback. */
export function getVehicleImage(imageUrl: string | null | undefined): ImageSourcePropType {
  return imageUrl ? { uri: imageUrl } : FALLBACK_VEHICLE_IMAGE;
}

/** Illustrative route for the booking map when an address has no coordinates. */
export const PREVIEW_FALLBACK_ROUTE = [
  { latitude: 28.6385, longitude: 77.2405 },
  { latitude: 28.635, longitude: 77.239 },
  { latitude: 28.6317, longitude: 77.2415 },
  { latitude: 28.6321, longitude: 77.2455 },
  { latitude: 28.629, longitude: 77.248 },
];
