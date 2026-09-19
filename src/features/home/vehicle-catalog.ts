import type { ImageSourcePropType } from 'react-native';

export interface RideOption {
  id: string;
  name: string;
  description: string;
  etaMinutes: number;
  price: number;
  image: ImageSourcePropType;
}

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'two-wheeler',
    name: 'Two-Wheeler',
    description: 'Up to 10 kg · Documents, food, small parcels',
    etaMinutes: 12,
    price: 620,
    image: require('@/assets/images/vehicles/bike.png'),
  },
  {
    id: 'three-wheeler',
    name: 'Three-Wheeler',
    description: 'Up to 150 kg · Medium boxes, small furniture',
    etaMinutes: 18,
    price: 620,
    image: require('@/assets/images/vehicles/pickup-truck.png'),
  },
  {
    id: 'e-rickshaw',
    name: 'E-Rickshaw',
    description: 'Up to 300 kg · City deliveries, medium loads',
    etaMinutes: 20,
    price: 620,
    image: require('@/assets/images/vehicles/e-rikshaw.png'),
  },
  {
    id: 'mini-truck',
    name: 'Mini Truck',
    description: 'Up to 600 kg · Home appliances, large cargo',
    etaMinutes: 25,
    price: 850,
    image: require('@/assets/images/vehicles/mini-truck.png'),
  },
];

export function getRideOptionById(id: string): RideOption | undefined {
  return RIDE_OPTIONS.find((option) => option.id === id);
}
