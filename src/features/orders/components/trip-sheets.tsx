import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { FadeInDown, FadeOut } from 'react-native-reanimated';

import {
  AnimatedView,
  AppText,
  AppView,
  Button,
  IconBadge,
  TextField,
  type IconName,
} from '@/components/ui';
import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import { VehicleImage } from '@/components/vehicle-image';
import { useVehicleCatalog } from '@/hooks/use-catalog';
import type { Order } from '@/lib/api/models';
import { haptics } from '@/lib/haptics';
import { DURATION, ENTER_EASE_OUT } from '@/lib/motion';

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
    code: order.vehicle.code ?? fromCatalog?.code ?? null,
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
          code={vehicle.code}
          style={{ width: 170, height: 110 }}
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
    </BookingSheet>
  );
}

interface CancelReason {
  code: string;
  label: string;
  icon: IconName;
}

const OTHER_REASON_CODE = 'OTHER';
const MIN_OTHER_MESSAGE_LENGTH = 3;

/** Reasons that fit the moment: before a driver accepts, and after. Sent as the cancel reason code. */
function cancelReasons(hasDriver: boolean): CancelReason[] {
  return hasDriver
    ? [
        { code: 'DRIVER_DELAYED', label: 'Driver is taking too long', icon: 'clock' },
        { code: 'DRIVER_ASKED_TO_CANCEL', label: 'Driver asked me to cancel', icon: 'phone' },
        { code: 'CHANGED_MIND', label: 'Changed my mind', icon: 'arrow.up.arrow.down' },
        { code: OTHER_REASON_CODE, label: 'My reason is not listed', icon: 'questionmark.circle' },
      ]
    : [
        { code: 'NO_DRIVER_ALLOCATED', label: 'Driver was not allocated', icon: 'person' },
        { code: 'CHANGED_MIND', label: 'Changed my mind', icon: 'arrow.up.arrow.down' },
        { code: 'BOOKED_BY_MISTAKE', label: 'Booked by mistake', icon: 'xmark.circle.fill' },
        { code: OTHER_REASON_CODE, label: 'My reason is not listed', icon: 'questionmark.circle' },
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
  // "My reason is not listed" needs the customer's own words; the other reasons speak for themselves.
  const isOther = code === OTHER_REASON_CODE;
  const hasMessage = comment.trim().length >= MIN_OTHER_MESSAGE_LENGTH;
  // Set when the customer tries to cancel without the note: the field turns red and explains.
  const [showMessageError, setShowMessageError] = useState(false);
  const messageRef = useRef<TextInputInstance>(null);

  const handleSubmit = () => {
    if (!code) return;
    if (isOther && !hasMessage) {
      setShowMessageError(true);
      haptics.error();
      messageRef.current?.focus();
      return;
    }
    onSubmit({ code, text: isOther ? comment.trim() : '' });
  };

  // Opening again starts fresh.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCode(null);
      setComment('');
      setShowMessageError(false);
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
            // Stays tappable once a reason is chosen: with no note it explains what is missing.
            disabled={!code}
            loading={isCancelling}
            onPress={handleSubmit}
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
            onPress={() => {
              setCode(reason.code);
              setShowMessageError(false);
            }}
          />
        ))}
      </AppView>
      {isOther ? (
        <AnimatedView
          entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
          exiting={FadeOut.duration(DURATION.small)}
          className="mt-3"
        >
          <TextField
            ref={messageRef}
            label="Tell us what happened"
            required
            highlighted={!hasMessage}
            error={
              showMessageError && !hasMessage
                ? 'Please write your reason to cancel the trip'
                : undefined
            }
            value={comment}
            onChangeText={(text) => {
              setComment(text);
              if (text.trim().length >= MIN_OTHER_MESSAGE_LENGTH) setShowMessageError(false);
            }}
            placeholder="Write your reason here"
            hint="Required: a short note helps us improve."
            multiline
            autoFocus
            maxLength={500}
            inputClassName="min-h-[88px]"
            textAlignVertical="top"
            accessibilityLabel="Your reason for cancelling"
          />
        </AnimatedView>
      ) : null}
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
