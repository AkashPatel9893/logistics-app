import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { AppPressable, AppText, AppView } from '@/components/ui';
import { cn } from '@/lib/cn';

import { FEATURED_VEHICLES, STANDARD_VEHICLES } from '../mock-data';
import type { VehicleOption } from '../types';

export interface VehicleSelectionGridProps {
  selectedId: string;
  onSelectVehicle: (vehicle: VehicleOption) => void;
}

export function VehicleSelectionGrid({ selectedId, onSelectVehicle }: VehicleSelectionGridProps) {
  return (
    <AppView className="w-full mt-6">
      {/* Section Title */}
      <AppView className="px-5 mb-3">
        <AppText className="text-[19px] font-bold text-neutral-900 dark:text-neutral-50">
          Select vehicle type
        </AppText>
      </AppView>

      {/* Row 1: 2 Featured Vehicles (Bike & Mini Truck) */}
      <AppView className="flex-row px-5 gap-3">
        {FEATURED_VEHICLES.map((vehicle) => {
          const isSelected = selectedId === vehicle.id;
          return (
            <AppPressable
              key={vehicle.id}
              onPress={() => onSelectVehicle(vehicle)}
              className={cn(
                'flex-1 bg-white dark:bg-neutral-900 rounded-[24px] p-3.5 border transition-all active:scale-[0.98]',
                isSelected
                  ? 'border-[#FF5500] bg-orange-50/30 dark:bg-orange-950/20'
                  : 'border-neutral-100 dark:border-neutral-800',
              )}
            >
              {/* Vehicle 3D Image */}
              <AppView className="w-full h-24 items-center justify-center">
                <Image
                  source={vehicle.image}
                  style={styles.featuredImage}
                  contentFit="contain"
                  priority="high"
                />
              </AppView>

              {/* Title & Description */}
              <AppText className="text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                {vehicle.name}
              </AppText>
              {vehicle.description && (
                <AppText className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-[15px]">
                  {vehicle.description}
                </AppText>
              )}
            </AppPressable>
          );
        })}
      </AppView>

      {/* Row 2: 3 Standard Vehicles (Large Truck, e-Rikshaw, Pickup Truck) */}
      <AppView className="flex-row px-5 gap-2.5 mt-3">
        {STANDARD_VEHICLES.map((vehicle) => {
          const isSelected = selectedId === vehicle.id;
          return (
            <AppPressable
              key={vehicle.id}
              onPress={() => onSelectVehicle(vehicle)}
              className={cn(
                'flex-1 bg-white dark:bg-neutral-900 rounded-[20px] p-2.5 items-center justify-between border min-h-[114px] transition-all active:scale-[0.97]',
                isSelected
                  ? 'border-[#FF5500] bg-orange-50/30 dark:bg-orange-950/20'
                  : 'border-neutral-100 dark:border-neutral-800',
              )}
            >
              {/* Vehicle 3D Image */}
              <AppView className="w-full h-15 items-center justify-center">
                <Image
                  source={vehicle.image}
                  style={styles.standardImage}
                  contentFit="contain"
                  priority="high"
                />
              </AppView>

              {/* Title */}
              <AppText
                numberOfLines={1}
                className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 text-center mt-1"
              >
                {vehicle.name}
              </AppText>
            </AppPressable>
          );
        })}
      </AppView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  standardImage: {
    width: '100%',
    height: '100%',
  },
});
