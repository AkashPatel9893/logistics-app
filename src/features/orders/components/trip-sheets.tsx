import { useState } from 'react';

import { AppText, AppView, Button, IconBadge, TextField, type IconName } from '@/components/ui';
import { BOOKING_NOTES } from '@/lib/booking-notes';
import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import { VehicleImage } from '@/components/vehicle-image';
import { useVehicleCatalog } from '@/hooks/use-catalog';
import type { Order } from '@/lib/api/models';

import { OrderRoute } from './order-route';

/** The order's vehicle with its catalog picture and capacity (the order carries only id and name). */
export function useOrderVehicle(order: Order) {
  const catalog = useVehicleCatalog().data;
  const fromCatalog = catalog
    ? [...catalog.featured, ...catalog.standard].find((v) => v.id === order.vehicle.id)
    : undefined;
  return {
    name: order.vehicle.name || fromCatalog?.name || 'Delivery',
    imageUrl: order.vehicle.imageUrl ?? fromCatalog?.imageUrl ?? null,
    capacityKg: fromCatalog?.capacityKg ?? null,
  };
}

export interface TripDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
}

/** "View details" on the live trip: the vehicle and what it carries, every stop, the trip rules. */
export function TripDetailsSheet({ visible, onClose, order }: TripDetailsSheetProps) {
  const vehicle = useOrderVehicle(order);
  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      size="full"
      title="Trip details"
      subtitle={`Booking #${order.number}`}
      footer={<Button label="Okay" className="h-14" onPress={onClose} />}
    >
      <AppView center className="h-36 overflow-hidden rounded-[24px] bg-brand-soft">
        <VehicleImage
          imageUrl={vehicle.imageUrl}
          style={{ width: 170, height: 110 }}
          fallbackClassName="size-20 rounded-full bg-surface"
          fallbackIconSize={36}
          fallbackTone="brand"
        />
      </AppView>
      <AppView className="items-center pb-4 pt-3">
        <AppText className="text-[18px] font-bold text-foreground">{vehicle.name}</AppText>
        {vehicle.capacityKg ? (
          <AppText className="mt-0.5 text-[13px] text-muted">
            Carries up to {vehicle.capacityKg} kg
          </AppText>
        ) : null}
      </AppView>
      <AppView className="rounded-[22px] bg-surface-muted p-4">
        <OrderRoute order={order} />
      </AppView>
      <AppView className="mt-3 gap-2 rounded-[22px] border border-border p-4">
        {BOOKING_NOTES.map((note) => (
          <AppView key={note} row className="items-start">
            <AppView className="mr-2.5 mt-[7px] size-1.5 rounded-full bg-brand" />
            <AppText className="flex-1 text-[13px] leading-[19px] text-foreground-secondary">
              {note}
            </AppText>
          </AppView>
        ))}
      </AppView>
    </BookingSheet>
  );
}

interface CancelReason {
  code: string;
  label: string;
  icon: IconName;
}

/** Reasons that fit the moment: before a driver accepts, and after. Sent as the cancel reason code. */
function cancelReasons(hasDriver: boolean): CancelReason[] {
  return hasDriver
    ? [
        { code: 'DRIVER_DELAYED', label: 'Driver is taking too long', icon: 'clock' },
        { code: 'DRIVER_ASKED_TO_CANCEL', label: 'Driver asked me to cancel', icon: 'phone' },
        { code: 'CHANGED_MIND', label: 'Changed my mind', icon: 'arrow.up.arrow.down' },
        { code: 'OTHER', label: 'My reason is not listed', icon: 'questionmark.circle' },
      ]
    : [
        { code: 'NO_DRIVER_ALLOCATED', label: 'Driver was not allocated', icon: 'person' },
        { code: 'CHANGED_MIND', label: 'Changed my mind', icon: 'arrow.up.arrow.down' },
        { code: 'BOOKED_BY_MISTAKE', label: 'Booked by mistake', icon: 'xmark.circle.fill' },
        { code: 'OTHER', label: 'My reason is not listed', icon: 'questionmark.circle' },
      ];
}

export interface CancelTripSheetProps {
  visible: boolean;
  onClose: () => void;
  hasDriver: boolean;
  isCancelling: boolean;
  onSubmit: (reason: { code: string; text: string }) => void;
}

/** "Cancel trip": pick a reason (and add a comment), then submit. */
export function CancelTripSheet({
  visible,
  onClose,
  hasDriver,
  isCancelling,
  onSubmit,
}: CancelTripSheetProps) {
  const [code, setCode] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  // Opening again starts fresh.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCode(null);
      setComment('');
    }
  }

  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      // Full height so Go back / Cancel trip stay in view (a tall auto sheet opens half-way).
      size="full"
      title="Why are you cancelling?"
      subtitle={hasDriver ? 'Your driver will be released.' : 'We will stop looking for a driver.'}
      footer={
        <AppView row className="gap-3">
          <Button label="Go back" variant="outline" className="h-14 flex-1" onPress={onClose} />
          <Button
            label="Cancel trip"
            variant="destructive"
            className="h-14 flex-1"
            disabled={!code}
            loading={isCancelling}
            onPress={() => code && onSubmit({ code, text: comment })}
          />
        </AppView>
      }
    >
      <AppView className="gap-2">
        {cancelReasons(hasDriver).map((reason) => (
          <SheetOption
            key={reason.code}
            label={reason.label}
            icon={reason.icon}
            selected={code === reason.code}
            onPress={() => setCode(reason.code)}
          />
        ))}
      </AppView>
      <TextField
        className="mt-3"
        value={comment}
        onChangeText={setComment}
        placeholder="Add a comment to help us improve (optional)"
        multiline
        maxLength={500}
        inputClassName="min-h-[80px]"
        textAlignVertical="top"
        accessibilityLabel="Comment"
      />
    </BookingSheet>
  );
}

export interface BookingCancelledSheetProps {
  visible: boolean;
  onClose: () => void;
  orderNumber: string;
  fee: number | null;
}

/** Shown once the cancel goes through. */
export function BookingCancelledSheet({
  visible,
  onClose,
  orderNumber,
  fee,
}: BookingCancelledSheetProps) {
  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      title="Booking cancelled"
      footer={<Button label="Okay" className="h-14" onPress={onClose} />}
    >
      <AppView className="items-center pb-2">
        <AppView center className="size-20 rounded-full bg-danger/10">
          <IconBadge
            name="xmark.circle.fill"
            tone="danger"
            iconSize={26}
            className="size-12 rounded-full bg-surface"
          />
        </AppView>
        <AppText className="mt-3 text-center text-[14px] leading-[20px] text-muted">
          Your booking #{orderNumber} has been cancelled.
          {fee ? ` A cancellation charge of ₹${fee} applies.` : ' No charge applies.'}
        </AppText>
      </AppView>
    </BookingSheet>
  );
}
