import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { TripDraft } from '@/stores/trip-store';

import { placeLine } from '../place-line';

export interface TripLocationsCardProps {
  draft: TripDraft;
  /** Shown for the pickup when no sender was entered: the booking defaults to the customer. */
  fallbackSender: { name: string; phone: string } | null;
  onPickupPress: () => void;
  onDropPress: () => void;
  onSwap: () => void;
  /** Absent once the trip has as many stops as the server allows. */
  onAddStop?: () => void;
  onEditLocations: () => void;
}

/** Pickup and drop with who is at each, plus the actions that change them (vehicle screen). */
export function TripLocationsCard({
  draft,
  fallbackSender,
  onPickupPress,
  onDropPress,
  onSwap,
  onAddStop,
  onEditLocations,
}: TripLocationsCardProps) {
  const sender = draft.pickupDetails
    ? { name: draft.pickupDetails.contactName, phone: draft.pickupDetails.contactPhone }
    : fallbackSender;
  const receiver = draft.dropDetails
    ? { name: draft.dropDetails.contactName, phone: draft.dropDetails.contactPhone }
    : null;
  const stopCount = draft.midStops.length;

  return (
    <AppView className="mx-4 rounded-2xl border border-border/40 bg-surface shadow-sm">
      <AppView row className="items-center py-2 pl-3 pr-1">
        <AppView className="flex-1">
          <LocationRow
            kind="pickup"
            contact={sender}
            place={placeLine(draft.pickupLabel, draft.pickupAddress)}
            onPress={onPickupPress}
          />
          {stopCount > 0 ? (
            <AppText className="ml-10 py-0.5 text-[12px] font-semibold text-brand">
              {stopCount} {stopCount === 1 ? 'stop' : 'stops'} on the way
            </AppText>
          ) : null}
          <LocationRow
            kind="drop"
            contact={receiver}
            place={placeLine(draft.dropLabel, draft.dropAddress)}
            onPress={onDropPress}
          />
        </AppView>
        <AppPressable
          onPress={onSwap}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Swap pickup and drop"
          className="ml-1 size-10 items-center justify-center rounded-full border border-border/60 bg-surface"
        >
          <Icon name="arrow.up.arrow.down" size={16} tone="foreground" />
        </AppPressable>
      </AppView>

      <AppView row className="border-t border-divider">
        {onAddStop ? (
          <>
            <AppPressable
              onPress={onAddStop}
              accessibilityRole="button"
              accessibilityLabel="Add Stop"
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3"
            >
              <Icon name="plus.circle.fill" size={16} tone="brand" />
              <AppText className="text-[13px] font-bold text-brand">Add Stop</AppText>
            </AppPressable>
            <AppView className="my-2.5 w-px bg-divider" />
          </>
        ) : null}
        <AppPressable
          onPress={onEditLocations}
          accessibilityRole="button"
          accessibilityLabel="Edit Locations"
          className="flex-1 flex-row items-center justify-center gap-1.5 py-3"
        >
          <Icon name="pencil" size={14} tone="brand" />
          <AppText className="text-[13px] font-bold text-brand">Edit Locations</AppText>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

function LocationRow({
  kind,
  contact,
  place,
  onPress,
}: {
  kind: 'pickup' | 'drop';
  contact: { name: string; phone: string } | null;
  place: string;
  onPress: () => void;
}) {
  const who = contact ? [contact.name, contact.phone].filter(Boolean).join(' · ') : '';
  const role = kind === 'pickup' ? 'Pickup' : 'Drop';
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${role}: ${[who, place].filter(Boolean).join(', ')}. Tap to change.`}
      className="flex-row items-center py-1.5"
    >
      <AppView
        center
        className={cn(
          'mr-3 size-7 rounded-full',
          kind === 'pickup' ? 'bg-emerald-500' : 'bg-rose-500',
        )}
      >
        <Icon name={kind === 'pickup' ? 'arrow.up' : 'arrow.down'} size={14} color="#FFFFFF" />
      </AppView>
      <AppView className="flex-1">
        {who ? (
          <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
            {who}
          </AppText>
        ) : null}
        <AppText numberOfLines={1} className="text-[12px] text-muted">
          {place || (kind === 'pickup' ? 'Select pickup location' : 'Where is your Drop ?')}
        </AppText>
      </AppView>
    </AppPressable>
  );
}
