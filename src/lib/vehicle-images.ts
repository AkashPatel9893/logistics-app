import type { ImageSourcePropType } from 'react-native';

const SCOOTER: ImageSourcePropType = require('@/assets/images/vehicles/scooter.png');
const THREE_WHEELER: ImageSourcePropType = require('@/assets/images/vehicles/three-wheeler.png');
const MINI_TRUCK: ImageSourcePropType = require('@/assets/images/vehicles/mini-truck.png');
const PICKUP: ImageSourcePropType = require('@/assets/images/vehicles/pickup.png');
const HEAVY_TRUCK: ImageSourcePropType = require('@/assets/images/vehicles/heavy-truck.png');

const BY_CODE: Record<string, ImageSourcePropType> = {
  BIKE: SCOOTER,
  THREE_WHEELER,
  TATA_ACE: MINI_TRUCK,
  PICKUP_8FT: PICKUP,
};

export function getBundledVehicleImage(code: string | null | undefined): ImageSourcePropType {
  const key = (code ?? '').toUpperCase();
  const exact = BY_CODE[key];
  if (exact) return exact;
  if (/BIKE|SCOOT|TWO_?WHEEL|2_?W/.test(key)) return SCOOTER;
  if (/THREE|3_?W|AUTO|RICKSHAW/.test(key)) return THREE_WHEELER;
  if (/PICK/.test(key)) return PICKUP;
  if (/LARGE|HEAVY|CONTAINER|TRAILER|TON|LORRY|CARGO/.test(key)) return HEAVY_TRUCK;
  return MINI_TRUCK;
}
