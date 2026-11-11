import { StyleSheet, useWindowDimensions } from 'react-native';

import { AnimatedView, AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { VehicleCatalog, VehicleType } from '@/lib/api/models';
import { enterFromBelow } from '@/lib/motion';

const SIDE_PADDING = 20;
const GAP = 12;
const STANDARD_COLUMNS = 3;

interface VehicleTileProps {
  vehicle: VehicleType;
  onPress: () => void;
}

function formatCapacity(kg: number): string | null {
  if (!kg) return null;
  return kg >= 1000 ? `${Number((kg / 1000).toFixed(1))} t` : `${kg} kg`;
}

/** The catalog fills a missing description with the payload, which the subtitle already shows. */
function extraDescription(vehicle: VehicleType): string | null {
  const text = vehicle.description?.trim();
  if (!text || text === `${vehicle.capacityKg} kg payload`) return null;
  return text;
}

function FeaturedVehicleTile({ vehicle, onPress }: VehicleTileProps) {
  const capacity = formatCapacity(vehicle.capacityKg);
  const description = extraDescription(vehicle);
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[vehicle.name, capacity && `carries up to ${capacity}`, description]
        .filter(Boolean)
        .join(', ')}
      pressScale={0.97}
      className="flex-1 rounded-[26px] border bg-surface p-2 border-border/70"
      style={styles.cardShadow}
    >
      <AppView center className="h-[112px] w-full overflow-hidden rounded-[20px] bg-brand-soft">
        <VehicleImage
          imageUrl={vehicle.imageUrl}
          className="h-[88px] w-[88%]"
          fallbackClassName="size-14 rounded-full bg-surface"
          fallbackIconSize={26}
          fallbackTone="brand"
        />
      </AppView>
      <AppView row className="items-center px-1.5 pb-1 pt-2.5">
        <AppView className="flex-1 pr-2">
          <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
            {vehicle.name}
          </AppText>
          <AppText numberOfLines={1} className="mt-0.5 text-[11.5px] text-muted">
            {[capacity && `Up to ${capacity}`, description].filter(Boolean).join(' · ') || ' '}
          </AppText>
        </AppView>
        <AppView center className="size-8 rounded-full bg-brand">
          <Icon name="arrow.right" size={14} tone="brand-foreground" weight="bold" />
        </AppView>
      </AppView>
    </AppPressable>
  );
}

function StandardVehicleTile({ vehicle, onPress }: VehicleTileProps) {
  const capacity = formatCapacity(vehicle.capacityKg);
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[vehicle.name, capacity && `carries up to ${capacity}`]
        .filter(Boolean)
        .join(', ')}
      pressScale={0.96}
      className="w-full rounded-[20px] border bg-surface p-1.5 border-border/70"
      style={styles.cardShadow}
    >
      <AppView center className="h-[68px] w-full overflow-hidden rounded-[15px] bg-brand-soft">
        <VehicleImage
          imageUrl={vehicle.imageUrl}
          className="h-[56px] w-[90%]"
          fallbackClassName="size-10 rounded-full bg-surface"
          fallbackIconSize={18}
          fallbackTone="brand"
        />
      </AppView>
      <AppView className="px-1 pb-1 pt-2">
        {/* Room for two lines on every tile, so long names wrap and the row stays even. */}
        <AppText
          numberOfLines={2}
          className="h-8 text-center text-[12.5px] font-bold leading-[16px] text-foreground"
        >
          {vehicle.name}
        </AppText>
        <AppText numberOfLines={1} className="mt-0.5 text-center text-[11px] text-muted">
          {capacity ? `Up to ${capacity}` : ' '}
        </AppText>
      </AppView>
    </AppPressable>
  );
}

/** Two large tiles over a row of three, the grid's shape while the catalog loads. */
function VehicleGridSkeleton({ standardWidth }: { standardWidth: number }) {
  return (
    <AppView className="px-5">
      <AppView row style={{ gap: GAP }}>
        {[0, 1].map((key) => (
          <AppView key={key} className="flex-1 rounded-[26px] bg-surface p-2">
            <Skeleton className="h-[112px] w-full rounded-[20px]" />
            <Skeleton className="ml-1.5 mt-3 h-4 w-20 rounded-md" />
            <Skeleton className="mb-1 ml-1.5 mt-2 h-3 w-14 rounded-md" />
          </AppView>
        ))}
      </AppView>
      <AppView row className="mt-3" style={{ gap: GAP }}>
        {[0, 1, 2].map((key) => (
          <AppView
            key={key}
            className="rounded-[20px] bg-surface p-1.5"
            style={{ width: standardWidth }}
          >
            <Skeleton className="h-[68px] w-full rounded-[15px]" />
            <Skeleton className="mx-auto mb-1 mt-2.5 h-3.5 w-16 rounded-md" />
          </AppView>
        ))}
      </AppView>
    </AppView>
  );
}

export interface VehicleSelectionGridProps {
  catalog: VehicleCatalog | undefined;
  onSelectVehicle: (vehicle: VehicleType) => void;
}

export function VehicleSelectionGrid({ catalog, onSelectVehicle }: VehicleSelectionGridProps) {
  const { width } = useWindowDimensions();
  // Exact column width, so the last row lines up with the rows above whatever the count.
  const standardWidth = Math.floor(
    (width - SIDE_PADDING * 2 - GAP * (STANDARD_COLUMNS - 1)) / STANDARD_COLUMNS,
  );

  return (
    <AppView className="mt-7 w-full">
      <AppView row className="mb-3.5 items-end justify-between px-5">
        <AppView className="flex-1">
          <AppText accessibilityRole="header" className="text-[20px] font-bold text-foreground">
            Choose a vehicle
          </AppText>
          <AppText className="mt-0.5 text-[12.5px] text-muted">
            You see the price before you book
          </AppText>
        </AppView>
      </AppView>

      {catalog ? null : <VehicleGridSkeleton standardWidth={standardWidth} />}

      <AppView className="flex-row px-5" style={{ gap: GAP }}>
        {catalog?.featured.map((vehicle, index) => (
          <AnimatedView key={vehicle.id} entering={enterFromBelow(index)} className="flex-1">
            <FeaturedVehicleTile vehicle={vehicle} onPress={() => onSelectVehicle(vehicle)} />
          </AnimatedView>
        ))}
      </AppView>

      {catalog?.standard.length ? (
        <AppView className="mt-3 flex-row flex-wrap px-5" style={{ gap: GAP }}>
          {catalog.standard.map((vehicle, index) => (
            <AnimatedView
              key={vehicle.id}
              entering={enterFromBelow(index + 2)}
              style={{ width: standardWidth }}
            >
              <StandardVehicleTile vehicle={vehicle} onPress={() => onSelectVehicle(vehicle)} />
            </AnimatedView>
          ))}
        </AppView>
      ) : null}
    </AppView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
});
