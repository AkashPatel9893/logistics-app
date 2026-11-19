import { AnimatedView, AppPressable, AppText, AppView, Icon, IconBadge } from '@/components/ui';
import { type Order } from '@/lib/api/models';
import { formatFare } from '@/lib/format';
import { DURATION, FadeIn } from '@/lib/motion';

import { type LiveEta } from '../tracking-geometry';
import { liveEtaCopy, ORDER_STAGE_HEADLINE } from '../order-stage-labels';
import { DriverInfo } from './driver-info';
import { OrderRoute } from './order-route';
import { ShareTrackingCard } from './share-tracking-card';
import { StopProgressList } from './stop-progress-list';
import { TrackingProgressBar } from './tracking-timeline';

interface TrackingSheetContentProps {
  order: Order;
  liveEta: LiveEta | null;
  locationStale: boolean;
  isRefetchError: boolean;
  isSharing: boolean;
  isCancelling: boolean;
  isCancellable: boolean;
  isOnTheRoad: boolean;
  onRetryRefresh: () => void;
  onContactDriver: () => void;
  onOpenDetails: () => void;
  onShare: (stopId?: string, code?: string) => void;
  onOpenSupport: () => void;
  onOpenCancel: () => void;
}

export function TrackingSheetContent({
  order,
  liveEta,
  locationStale,
  isRefetchError,
  isSharing,
  isCancelling,
  isCancellable,
  isOnTheRoad,
  onRetryRefresh,
  onContactDriver,
  onOpenDetails,
  onShare,
  onOpenSupport,
  onOpenCancel,
}: TrackingSheetContentProps) {
  const { status } = order;
  const isSearching = status === 'searching';
  const etaCopy = liveEta ? liveEtaCopy(status, liveEta, order.stops.length > 1) : null;
  const paymentLabel = order.payment.methodLabel !== '—' ? order.payment.methodLabel : 'Cash';
  const paymentNote =
    order.payment.timing === 'on-pickup'
      ? 'Pay at pickup'
      : order.payment.timing === 'on-delivery'
        ? 'Pay at drop'
        : 'Payment method';

  return (
    <>
      {isRefetchError ? (
        <AppPressable
          onPress={onRetryRefresh}
          accessibilityRole="button"
          accessibilityLabel="Could not refresh order. Tap to retry."
          className="mb-3 rounded-2xl bg-surface-muted px-4 py-3"
        >
          <AppText className="text-[13px] text-muted">
            Couldn&apos;t refresh your order. Tap to try again.
          </AppText>
        </AppPressable>
      ) : null}

      <AnimatedView key={status} entering={FadeIn.duration(DURATION.enter)}>
        <AppView row className="items-center">
          <IconBadge
            name={isSearching ? 'magnifyingglass' : 'box.truck.fill'}
            tone="brand"
            iconSize={20}
            className="mr-3 size-12 rounded-2xl bg-brand-soft"
          />
          <AppView className="flex-1">
            <AppText className="text-[19px] font-extrabold text-foreground">
              {order.noDriverFound
                ? 'No driver available yet'
                : isSearching
                  ? 'Searching for drivers nearby…'
                  : (etaCopy?.headline ?? ORDER_STAGE_HEADLINE[status])}
            </AppText>
            <AppText className="mt-0.5 text-[13px] text-muted">
              {order.noDriverFound
                ? 'No driver has accepted so far. You can keep waiting or cancel — no charge.'
                : isSearching
                  ? 'Finding a partner near you'
                  : (etaCopy?.detail ??
                    [`Booking #${order.number}`, order.vehicle.name].filter(Boolean).join(' · '))}
            </AppText>
          </AppView>
        </AppView>
      </AnimatedView>

      <TrackingProgressBar stage={status} />

      {locationStale ? (
        <AppText className="mt-2 text-[12px] text-muted">
          Driver location temporarily unavailable or out of date.
        </AppText>
      ) : null}

      {order.pickupOtp && (status === 'heading_to_pickup' || status === 'arrived_at_pickup') ? (
        <AppView row className="mt-4 justify-between rounded-2xl bg-brand-tint px-4 py-3">
          <AppText className="text-[13px] font-semibold text-foreground">Pickup OTP</AppText>
          <AppText
            accessibilityLabel={`Pickup OTP ${order.pickupOtp.split('').join(' ')}`}
            className="text-[18px] font-extrabold tracking-[4px] text-brand"
          >
            {order.pickupOtp}
          </AppText>
        </AppView>
      ) : null}

      {order.driver || !isSearching ? (
        <DriverInfo
          driver={order.driver}
          onCall={order.driver?.phone ? onContactDriver : undefined}
        />
      ) : null}

      <AppView className="mt-4 rounded-[22px] bg-surface-muted p-4 pb-1">
        <OrderRoute order={order} compact />
        <AppPressable
          onPress={onOpenDetails}
          accessibilityRole="button"
          className="mt-3 flex-row items-center justify-center gap-1.5 border-t border-border py-3"
        >
          <Icon name="line.3.horizontal" size={15} tone="brand" />
          <AppText className="text-[13px] font-bold text-brand-strong">View details</AppText>
        </AppPressable>
      </AppView>

      {order.deliveryOtp && isOnTheRoad && order.stops.length <= 1 ? (
        <ShareTrackingCard
          deliveryOtp={order.deliveryOtp}
          isSharing={isSharing}
          onShare={() => onShare()}
        />
      ) : null}

      {order.stops.length > 1 ? (
        <StopProgressList stops={order.stops} onShare={(stop) => onShare(stop.id, stop.code)} />
      ) : null}

      <AppView row className="mt-3 items-center rounded-[22px] border border-border p-3.5">
        <IconBadge
          name={paymentLabel.toLowerCase() === 'cash' ? 'banknote' : 'creditcard'}
          tone="success"
          className="mr-3 rounded-xl bg-success/10"
        />
        <AppView className="flex-1">
          <AppText className="text-[15px] font-bold text-foreground">{paymentLabel}</AppText>
          <AppText className="mt-0.5 text-[12px] text-muted">{paymentNote}</AppText>
        </AppView>
        <AppText className="text-[17px] font-black tabular-nums text-foreground">
          {order.pricing.payable != null ? formatFare(order.pricing.payable) : '—'}
        </AppText>
      </AppView>

      <AppPressable
        onPress={onOpenSupport}
        accessibilityRole="button"
        accessibilityLabel="Facing issues? Contact support"
        className="mt-3 flex-row items-center rounded-[22px] border border-border p-3.5"
      >
        <IconBadge name="message.fill" tone="brand" className="mr-3 rounded-xl bg-brand-soft" />
        <AppText className="flex-1 text-[15px] font-bold text-foreground">Facing issues?</AppText>
        <AppText className="text-[13px] font-bold text-brand-strong">Contact support</AppText>
      </AppPressable>

      {isCancellable ? (
        <AppPressable
          onPress={onOpenCancel}
          disabled={isCancelling}
          accessibilityRole="button"
          className="mt-2 items-center py-4"
        >
          <AppText className="text-[14px] font-bold text-danger">Cancel trip</AppText>
        </AppPressable>
      ) : null}
    </>
  );
}
