import type { ImageSourcePropType } from 'react-native';

export type VehicleCategory = 'featured' | 'standard';

export interface VehicleOption {
  id: string;
  name: string;
  description?: string;
  image: ImageSourcePropType;
  category: VehicleCategory;
  capacity?: string;
}

export interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  estimatedTime: string;
}

export type HomeTab = 'home' | 'orders' | 'account';
