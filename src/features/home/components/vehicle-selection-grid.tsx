import { FadeInDown } from 'react-native-reanimated';

import { AnimatedView, AppImage, AppPressable, AppText, AppView } from '@/components/ui';
import { getVehicleImage } from '@/features/trip/vehicle-catalog';
import type { VehicleCatalog, VehicleType } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';

interface VehicleTileProps {
  vehicle: VehicleType;
  isSelected: boolean;
  onPress: () => void;
}

const SELECTED_TILE = 'border-brand bg-brand-tint';
const UNSELECTED_TILE = 'border-divider';

function FeaturedVehicleTile({ vehicle, isSelected, onPress }: VehicleTileProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityLabel={`${vehicle.name}${vehicle.description ? `, ${vehicle.description}` : ''}`}
      accessibilityState={{ selected: isSelected }}
      pressScale={0.97}
      className={cn(
        'flex-1 rounded-[24px] border bg-surface p-3.5',
        isSelected ? SELECTED_TILE : UNSELECTED_TILE,
      )}
    >
      <AppView center className="h-24 w-full">
        <AppImage
          source={getVehicleImage(vehicle.imageKey)}
          contentFit="contain"
          priority="high"
          className="size-full"
        />
      </AppView>
      <AppText className="mt-2 text-[16px] font-bold text-foreground">{vehicle.name}</AppText>
      {vehicle.description ? (
        <AppText className="mt-1 text-[11px] leading-[15px] text-muted">
          {vehicle.description}
        </AppText>
      ) : null}
    </AppPressable>
  );
}

function StandardVehicleTile({ vehicle, isSelected, onPress }: VehicleTileProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityLabel={vehicle.name}
      accessibilityState={{ selected: isSelected }}
      pressScale={0.97}
      className={cn(
        'min-h-[114px] flex-1 items-center justify-between rounded-[20px] border bg-surface p-2.5',
        isSelected ? SELECTED_TILE : UNSELECTED_TILE,
      )}
    >
      <AppView center className="h-15 w-full">
        <AppImage
          source={getVehicleImage(vehicle.imageKey)}
          contentFit="contain"
          priority="high"
          className="size-full"
        />
      </AppView>
      <AppText numberOfLines={1} className="mt-1 text-center text-[13px] font-bold text-foreground">
        {vehicle.name}
      </AppText>
    </AppPressable>
  );
}

const tileEntering = (index: number) =>
  FadeInDown.duration(DURATION.enter).delay(staggerDelay(index)).easing(ENTER_EASE_OUT);

export interface VehicleSelectionGridProps {
  catalog: VehicleCatalog | undefined;
  selectedId: string | null;
  onSelectVehicle: (vehicle: VehicleType) => void;
}

export function VehicleSelectionGrid({
  catalog,
  selectedId,
  onSelectVehicle,
}: VehicleSelectionGridProps) {
  return (
    <AppView className="mt-6 w-full">
      <AppView className="mb-3 px-5">
        <AppText accessibilityRole="header" className="text-[19px] font-bold text-foreground">
          Select vehicle type
        </AppText>
      </AppView>

      <AppView className="flex-row gap-3 px-5">
        {catalog?.featured.map((vehicle, index) => (
          <AnimatedView key={vehicle.id} entering={tileEntering(index)} className="flex-1">
            <FeaturedVehicleTile
              vehicle={vehicle}
              isSelected={selectedId === vehicle.id}
              onPress={() => onSelectVehicle(vehicle)}
            />
          </AnimatedView>
        ))}
      </AppView>

      <AppView className="mt-3 flex-row gap-2.5 px-5">
        {catalog?.standard.map((vehicle, index) => (
          <AnimatedView key={vehicle.id} entering={tileEntering(index + 2)} className="flex-1">
            <StandardVehicleTile
              vehicle={vehicle}
              isSelected={selectedId === vehicle.id}
              onPress={() => onSelectVehicle(vehicle)}
            />
          </AnimatedView>
        ))}
      </AppView>
    </AppView>
  );
}
