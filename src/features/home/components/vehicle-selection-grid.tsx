import { StyleSheet } from 'react-native';

import { AnimatedView, AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { VehicleCatalog, VehicleType } from '@/lib/api/models';
import { enterFromBelow } from '@/lib/motion';

interface VehicleRowProps {
  vehicle: VehicleType;
  isLast: boolean;
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

function VehicleRow({ vehicle, isLast, onPress }: VehicleRowProps) {
  const capacity = formatCapacity(vehicle.capacityKg);
  const subtitle = [capacity && `Up to ${capacity}`, extraDescription(vehicle)]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[vehicle.name, capacity && `carries up to ${capacity}`]
        .filter(Boolean)
        .join(', ')}
      pressScale={0.99}
      className="flex-row items-center px-4 py-3.5"
    >
      <AppView center className="mr-3.5 size-14 overflow-hidden rounded-full bg-brand-soft">
        <VehicleImage
          imageUrl={vehicle.imageUrl}
          className="h-[38px] w-[44px]"
          fallbackClassName="size-14"
          fallbackIconSize={24}
          fallbackTone="brand"
        />
      </AppView>

      <AppView className="flex-1 pr-3">
        <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
          {vehicle.name}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
            {subtitle}
          </AppText>
        ) : null}
      </AppView>

      <AppView center className="size-8 rounded-full bg-surface-muted">
        <Icon name="chevron.right" size={14} tone="muted" weight="bold" />
      </AppView>

      {/* Hairline between rows, inset to start under the text. */}
      {isLast ? null : (
        <AppView className="absolute bottom-0 left-[86px] right-4 h-px bg-divider" />
      )}
    </AppPressable>
  );
}

/** Rows shaped like the list, shown while the catalog loads. */
function VehicleListSkeleton() {
  return (
    <AppView className="mx-5 rounded-3xl bg-surface" style={styles.cardShadow}>
      {[0, 1, 2, 3].map((key) => (
        <AppView key={key} row className="px-4 py-3.5">
          <Skeleton className="mr-3.5 size-14 rounded-full" />
          <AppView className="flex-1 justify-center gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </AppView>
        </AppView>
      ))}
    </AppView>
  );
}

export interface VehicleSelectionGridProps {
  catalog: VehicleCatalog | undefined;
  onSelectVehicle: (vehicle: VehicleType) => void;
}

/** Home's vehicle picker: one grouped list, the catalog's featured vehicles first. */
export function VehicleSelectionGrid({ catalog, onSelectVehicle }: VehicleSelectionGridProps) {
  const vehicles = catalog ? [...catalog.featured, ...catalog.standard] : [];

  return (
    <AppView className="mt-7 w-full">
      <AppView className="mb-3.5 px-5">
        <AppText accessibilityRole="header" className="text-[20px] font-bold text-foreground">
          Choose a vehicle
        </AppText>
        <AppText className="mt-0.5 text-[12.5px] text-muted">
          You see the price before you book
        </AppText>
      </AppView>

      {catalog ? (
        <AppView className="mx-5 overflow-hidden rounded-3xl bg-surface" style={styles.cardShadow}>
          {vehicles.map((vehicle, index) => (
            <AnimatedView key={vehicle.id} entering={enterFromBelow(index)}>
              <VehicleRow
                vehicle={vehicle}
                isLast={index === vehicles.length - 1}
                onPress={() => onSelectVehicle(vehicle)}
              />
            </AnimatedView>
          ))}
        </AppView>
      ) : (
        <VehicleListSkeleton />
      )}
    </AppView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
});
