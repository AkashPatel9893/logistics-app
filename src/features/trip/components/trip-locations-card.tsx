import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import type { TripDraft } from '@/stores';

import { placeLine } from '../place-line';
import { StopBadge } from './stop-badge';

export interface TripLocationsCardProps {
  draft: TripDraft;
  fallbackSender: { name: string; phone: string } | null;
  onPickupPress: () => void;
  onDropPress: () => void;
  onSwap: () => void;
  onAddStop?: () => void;
  onEditLocations: () => void;
}

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
  const stopNames = draft.midStops
    .map((stop) => stop.label)
    .filter(Boolean)
    .join(' → ');

  return (
    <AppView className="mx-4 rounded-[26px] bg-surface shadow-card">
      <AppView row className="items-center py-2.5 pl-3.5 pr-2">
        <AppView className="flex-1">
          <LocationRow
            kind="pickup"
            contact={sender}
            place={placeLine(draft.pickupLabel, draft.pickupAddress)}
            onPress={onPickupPress}
          />
          <AppView row className="items-center">
            <AppView className="ml-[13px] h-5 w-0.5 rounded-full bg-border" />
            {stopCount > 0 ? (
              <AppPressable
                onPress={onEditLocations}
                accessibilityRole="button"
                accessibilityLabel={`${stopCount} ${stopCount === 1 ? 'stop' : 'stops'} on the way: ${stopNames}. Tap to edit.`}
                className="ml-[25px] flex-1 flex-row items-center pr-2"
              >
                <AppView className="rounded-full bg-brand-soft px-2 py-0.5">
                  <AppText className="text-[10.5px] font-bold uppercase tracking-wide text-brand-strong">
                    {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
                  </AppText>
                </AppView>
                <AppText
                  numberOfLines={1}
                  className="ml-2 flex-1 text-[12px] font-medium text-muted"
                >
                  {stopNames}
                </AppText>
              </AppPressable>
            ) : null}
          </AppView>
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
          className="ml-1 size-10 items-center justify-center rounded-full bg-surface-muted"
        >
          <Icon name="arrow.up.arrow.down" size={16} tone="foreground" />
        </AppPressable>
      </AppView>

      <AppView row className="mx-3 mb-3 gap-2">
        {onAddStop ? (
          <AppPressable
            onPress={onAddStop}
            accessibilityRole="button"
            accessibilityLabel="Add Stop"
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-brand-soft py-2.5"
          >
            <Icon name="plus.circle.fill" size={16} tone="brand" />
            <AppText className="text-[13px] font-bold text-brand-strong">Add Stop</AppText>
          </AppPressable>
        ) : null}
        <AppPressable
          onPress={onEditLocations}
          accessibilityRole="button"
          accessibilityLabel="Edit Locations"
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-surface-muted py-2.5"
        >
          <Icon name="pencil" size={14} tone="foreground" />
          <AppText className="text-[13px] font-bold text-foreground">Edit Locations</AppText>
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
      className="flex-row items-center py-1"
    >
      <StopBadge kind={kind} className="mr-3" />
      <AppView className="flex-1">
        {who ? (
          <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
            {who}
          </AppText>
        ) : null}
        <AppText numberOfLines={1} className="mt-0.5 text-[12.5px] text-muted">
          {place || (kind === 'pickup' ? 'Select pickup location' : 'Where is your Drop ?')}
        </AppText>
      </AppView>
    </AppPressable>
  );
}
