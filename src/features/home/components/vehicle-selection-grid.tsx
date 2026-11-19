import { AnimatedView, AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { VehicleCatalog, VehicleType } from '@/lib/api/models';
import { enterFromBelow } from '@/lib/motion';

interface VehicleRowProps {
  vehicle: VehicleType;
  onPress: () => void;
}

function formatCapacity(kg: number): string | null {
  if (!kg) return null;
  return kg >= 1000 ? `${Number((kg / 1000).toFixed(1))} t` : `${kg} kg`;
}

const BEST_FOR: Record<string, string> = {
  TWO_WHEELER: 'Documents & parcels',
  THREE_WHEELER: 'Boxes & appliances',
  MINI_TRUCK: 'Shifting & commercial',
  PICKUP_TRUCK: 'Heavy industrial',
  LARGE_TRUCK: 'Full loads & long hauls',
};

function extraDescription(vehicle: VehicleType): string | null {
  const text = vehicle.description?.trim();
  if (!text || text === `${vehicle.capacityKg} kg payload`) return null;
  return text;
}

function formatCargoSize(size: NonNullable<VehicleType['cargoSizeCm']>): string {
  return `${size.length}×${size.width}×${size.height} cm`;
}

function vehicleLabel(vehicle: VehicleType, capacity: string | null, bestFor: string | null) {
  return [
    vehicle.name,
    capacity && `carries up to ${capacity}`,
    vehicle.cargoSizeCm && `cargo bed ${formatCargoSize(vehicle.cargoSizeCm)}`,
    bestFor,
  ]
    .filter(Boolean)
    .join(', ');
}

function VehicleRow({ vehicle, onPress }: VehicleRowProps) {
  const capacity = formatCapacity(vehicle.capacityKg);
  const bestFor =
    extraDescription(vehicle) ?? (vehicle.category ? BEST_FOR[vehicle.category] : null);
  const subtitle = [capacity && `Up to ${capacity}`, bestFor].filter(Boolean).join(' • ');

  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={vehicleLabel(vehicle, capacity, bestFor)}
      pressScale={0.98}
      className="mb-3 flex-row items-center rounded-3xl border border-border bg-surface py-3 pl-3 pr-4"
    >
      <AppView
        center
        className="mr-4 h-[76px] w-[92px] overflow-hidden rounded-2xl bg-surface-muted"
      >
        <VehicleImage
          imageUrl={vehicle.imageUrl}
          code={vehicle.code}
          style={{ width: 82, height: 62 }}
        />
      </AppView>

      <AppView className="flex-1 pr-2">
        <AppText numberOfLines={1} className="text-[17px] font-bold text-foreground">
          {vehicle.name}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} className="mt-1 text-[13.5px] font-medium text-muted">
            {subtitle}
          </AppText>
        ) : null}
      </AppView>

      <AppView center className="size-10 rounded-full bg-surface-muted">
        <Icon name="chevron.right" size={15} tone="muted" weight="bold" />
      </AppView>
    </AppPressable>
  );
}

function VehicleListSkeleton() {
  return (
    <AppView className="mx-5">
      {[0, 1, 2, 3].map((key) => (
        <Skeleton key={key} className="mb-3 h-[100px] w-full rounded-3xl" />
      ))}
    </AppView>
  );
}

export interface VehicleSelectionGridProps {
  catalog: VehicleCatalog | undefined;
  onSelectVehicle: (vehicle: VehicleType) => void;
}

export function VehicleSelectionGrid({ catalog, onSelectVehicle }: VehicleSelectionGridProps) {
  return (
    <AppView className="mt-7 w-full">
      <AppView className="mb-3.5 px-5">
        <AppText accessibilityRole="header" className="text-[20px] font-bold text-foreground">
          Choose a vehicle
        </AppText>
        <AppText className="mt-0.5 text-[12.5px] text-muted">
          Select the vehicle size that fits your shipment
        </AppText>
      </AppView>

      {catalog ? (
        <AppView className="mx-5">
          {[...catalog.featured, ...catalog.standard].map((vehicle, index) => (
            <AnimatedView key={vehicle.id} entering={enterFromBelow(index)}>
              <VehicleRow vehicle={vehicle} onPress={() => onSelectVehicle(vehicle)} />
            </AnimatedView>
          ))}
        </AppView>
      ) : (
        <VehicleListSkeleton />
      )}
    </AppView>
  );
}
