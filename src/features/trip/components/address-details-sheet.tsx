import { BookingSheet } from '@/components/booking-sheet';
import { AppText, AppView, Button } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import type { StopDetails, TripDraft } from '@/stores';

import { placeLine } from '../place-line';
import { StopBadge } from './stop-badge';

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
      <AppView className="mr-3 items-center">
        <StopBadge kind={kind} number={number} />
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
  fallbackSender: { name: string; phone: string } | null;
}

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
              code={option.vehicleCode}
              style={{ width: 64, height: 50 }}
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
