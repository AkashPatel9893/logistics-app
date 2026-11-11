import { AppText, AppView, Button, Icon } from '@/components/ui';
import type { RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import type { StopDetails, TripDraft } from '@/stores/trip-store';

import { placeLine } from '../place-line';
import { BookingSheet } from './booking-sheet';
import { VehicleImage } from './vehicle-image';

type StopKind = 'pickup' | 'stop' | 'drop';

function StopRow({
  kind,
  number,
  contact,
  place,
  isLast,
}: {
  kind: StopKind;
  number?: number;
  contact: { name: string; phone: string } | null;
  place: string;
  isLast: boolean;
}) {
  const who = contact ? [contact.name, contact.phone].filter(Boolean).join(' · ') : '';
  return (
    <AppView row>
      {/* Badge with a rail down to the next stop. */}
      <AppView className="mr-3 items-center">
        {kind === 'stop' ? (
          <AppView center className="size-7 rounded-full bg-slate-600">
            <AppText className="text-[12px] font-bold text-white">{number}</AppText>
          </AppView>
        ) : (
          <AppView
            center
            className={cn(
              'size-7 rounded-full',
              kind === 'pickup' ? 'bg-emerald-500' : 'bg-rose-500',
            )}
          >
            <Icon name={kind === 'pickup' ? 'arrow.up' : 'arrow.down'} size={14} color="#FFFFFF" />
          </AppView>
        )}
        {isLast ? null : <AppView className="my-1 w-0.5 flex-1 rounded-full bg-border" />}
      </AppView>
      <AppView className={cn('flex-1', isLast ? 'pb-0.5' : 'pb-4')}>
        <AppText className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {kind === 'pickup' ? 'Pickup' : kind === 'drop' ? 'Drop' : `Stop ${number}`}
        </AppText>
        {who ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[14px] font-bold text-foreground">
            {who}
          </AppText>
        ) : null}
        <AppText className="mt-0.5 text-[13px] leading-[18px] text-muted">{place}</AppText>
      </AppView>
    </AppView>
  );
}

const toContact = (details: StopDetails | null) =>
  details ? { name: details.contactName, phone: details.contactPhone } : null;

export interface AddressDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  draft: TripDraft;
  option: RideQuoteOption | null;
  /** Shown for the pickup when no sender was entered: the booking defaults to the customer. */
  fallbackSender: { name: string; phone: string } | null;
}

/** "View address details": the vehicle, then every stop in visiting order with who is there. */
export function AddressDetailsSheet({
  visible,
  onClose,
  draft,
  option,
  fallbackSender,
}: AddressDetailsSheetProps) {
  const rows: {
    kind: StopKind;
    number?: number;
    contact: ReturnType<typeof toContact>;
    place: string;
  }[] = [
    {
      kind: 'pickup',
      contact: toContact(draft.pickupDetails) ?? fallbackSender,
      place: placeLine(draft.pickupLabel, draft.pickupAddress),
    },
    ...draft.midStops.map((stop, index) => ({
      kind: 'stop' as const,
      number: index + 1,
      contact: toContact(stop.details),
      place: placeLine(stop.label, stop.address),
    })),
    {
      kind: 'drop',
      contact: toContact(draft.dropDetails),
      place: placeLine(draft.dropLabel, draft.dropAddress),
    },
  ];

  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      title="Address details"
      footer={<Button label="Okay" className="h-14" onPress={onClose} />}
    >
      {option ? (
        <AppView row className="mb-4 items-center">
          <AppView
            center
            className="mr-3 h-[60px] w-[72px] overflow-hidden rounded-2xl bg-brand-soft"
          >
            <VehicleImage
              imageUrl={option.imageUrl}
              style={{ width: 64, height: 50 }}
              fallbackClassName="size-10 rounded-full bg-surface"
              fallbackIconSize={18}
              fallbackTone="brand"
            />
          </AppView>
          <AppView className="flex-1">
            <AppText className="text-[18px] font-bold text-foreground">{option.name}</AppText>
            {option.description ? (
              <AppText className="mt-0.5 text-[12.5px] text-muted">{option.description}</AppText>
            ) : null}
          </AppView>
          {option.etaMinutes !== null ? (
            <AppView center className="rounded-2xl bg-surface-muted px-3 py-1.5">
              <AppText className="text-[18px] font-black leading-[22px] text-foreground">
                {option.etaMinutes}
              </AppText>
              <AppText className="text-[11px] font-semibold text-muted">mins</AppText>
            </AppView>
          ) : null}
        </AppView>
      ) : null}
      <AppView className="rounded-[22px] bg-surface-muted p-4">
        {rows.map((row, index) => (
          <StopRow key={`${row.kind}:${index}`} {...row} isLast={index === rows.length - 1} />
        ))}
      </AppView>
    </BookingSheet>
  );
}
