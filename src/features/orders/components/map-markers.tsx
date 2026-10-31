import { AppText, AppView } from '@/components/ui';

/** Pickup: a green dot in a white ring. */
export function PickupMarker() {
  return (
    <AppView
      center
      className="size-7 rounded-full border-[3px] border-white bg-emerald-500 shadow-md"
    >
      <AppView className="size-2 rounded-full bg-white" />
    </AppView>
  );
}

/** Drop: a dark square in a white ring, like the destination pin of Uber and Rapido. */
export function DropMarker() {
  return (
    <AppView
      center
      className="size-7 rounded-md border-[3px] border-white bg-neutral-900 shadow-md"
    >
      <AppView className="size-2 bg-white" />
    </AppView>
  );
}

/** The moving vehicle: an emoji in a brand-ringed circle, with a soft halo. */
export function VehicleMarker({ vehicleName }: { vehicleName: string }) {
  return (
    <AppView center className="size-14">
      <AppView className="absolute size-14 rounded-full bg-brand/15" />
      <AppView center className="size-10 rounded-full border-2 border-brand bg-white shadow-md">
        <AppText className="text-[20px]">{vehicleEmoji(vehicleName)}</AppText>
      </AppView>
    </AppView>
  );
}

/** The signed-in driver's own position on their map. */
export function SelfMarker() {
  return (
    <AppView center className="size-9">
      <AppView className="absolute size-9 rounded-full bg-sky-500/25" />
      <AppView className="size-4 rounded-full border-2 border-white bg-sky-500" />
    </AppView>
  );
}

export function vehicleEmoji(vehicleName: string): string {
  const name = vehicleName.toLowerCase();
  if (name.includes('2 wheel') || name.includes('bike')) return '🛵';
  if (name.includes('3 wheel')) return '🛺';
  return '🚚';
}
