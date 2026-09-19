import type { VehicleOption } from './types';

export const FEATURED_VEHICLES: VehicleOption[] = [
  {
    id: 'bike',
    name: 'Bike',
    description: 'Up to 20 kg · Documents, food, small parcels',
    image: require('@/assets/images/vehicles/bike.png'),
    category: 'featured',
    capacity: '20 kg',
  },
  {
    id: 'mini-truck',
    name: 'Mini Truck',
    description: 'Up to 600 kg · Home appliances, large cargo',
    image: require('@/assets/images/vehicles/mini-truck.png'),
    category: 'featured',
    capacity: '600 kg',
  },
];

export const STANDARD_VEHICLES: VehicleOption[] = [
  {
    id: 'large-truck',
    name: 'Large Truck',
    image: require('@/assets/images/vehicles/large-truck.png'),
    category: 'standard',
  },
  {
    id: 'e-rikshaw',
    name: 'e-Rikshaw',
    image: require('@/assets/images/vehicles/e-rikshaw.png'),
    category: 'standard',
  },
  {
    id: 'pickup-truck',
    name: 'Pickup Truck',
    image: require('@/assets/images/vehicles/pickup-truck.png'),
    category: 'standard',
  },
];
