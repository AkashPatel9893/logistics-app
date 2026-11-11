import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Share } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import {
  AnimatedView,
  AppPressable,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { formatFare } from '@/lib/format';
import { useCancelOrder, useRateOrder, useShareTracking } from '@/hooks/use-orders';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';

import { OrderDetails } from './components/order-details';
import { DriverInfo } from './components/driver-info';
import { OrderRoute } from './components/order-route';
import { ShareTrackingCard } from './components/share-tracking-card';
import { StopProgressList } from './components/stop-progress-list';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet, useTrackingSheetHeight } from './components/tracking-sheet';
import { TrackingProgressBar } from './components/tracking-timeline';
import { BookingCancelledSheet, CancelTripSheet, TripDetailsSheet } from './components/trip-sheets';
import { useOrderTracking } from './hooks/use-order-tracking';
import { liveEtaCopy, ORDER_STAGE_HEADLINE } from './order-stage-labels';
import { shareTrackingLink } from './share-tracking';
import { goBack } from '@/lib/go-back';

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <AppView center className="flex-1 bg-canvas px-8">
      <FocusAwareStatusBar />
      {children}
    </AppView>
  );
}

/** The trip screen's outline (header, map, status sheet) while the order loads. */
function TrackingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Trip" onBack={onBack} className="pb-3" />
      <Skeleton className="flex-1 rounded-none" />
      <AppView className="gap-3 rounded-t-[28px] bg-surface px-4 pb-10 pt-5">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="mt-2 h-2 w-full rounded-full" />
        <AppView row className="mt-3 items-center">
          <Skeleton className="mr-3 size-12 rounded-full" />
          <AppView className="flex-1 gap-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </AppView>
        </AppView>
        <Skeleton className="mt-2 h-24 w-full rounded-2xl" />
      </AppView>
    </AppView>
  );
}

export function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orderQuery, order, map, liveEta, locationStale } = useOrderTracking(orderId);
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const shareTracking = useShareTracking();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'details' | 'cancel' | null>(null);
  // "Booking cancelled" confirmation, shown over the receipt once the cancel goes through.
  const [showCancelled, setShowCancelled] = useState(false);
  const sheetHeight = useTrackingSheetHeight();

  if (orderQuery.isPending) {
    return <TrackingSkeleton onBack={() => goBack(router)} />;
  }

  if (orderQuery.isError && !order) {
    return (
      <CenteredMessage>
        <AppText className="text-center text-[17px] font-bold text-foreground">
          {getErrorMessage(orderQuery.error)}
        </AppText>
        <AppText className="mt-2 text-center text-[13px] text-muted">
          Order ID: {orderId ?? 'none'}
        </AppText>
        <Button
          label="Try Again"
          className="mt-6 self-stretch"
          onPress={() => orderQuery.refetch()}
        />
        <Button
          label="Back to Home"
          variant="ghost"
          className="mt-3 self-stretch"
          onPress={() => router.replace('/home')}
        />
      </CenteredMessage>
    );
  }

  if (!order) {
    return (
      <CenteredMessage>
        <AppText className="text-center text-[17px] font-bold text-foreground">
          We couldn&apos;t find that order
        </AppText>
        <Button
          label="Back to Home"
          className="mt-6 self-stretch"
          onPress={() => router.replace('/home')}
        />
      </CenteredMessage>
    );
  }

  const { status } = order;
  const isSearching = status === 'searching';
  const isFinished =
    status === 'delivered' ||
    status === 'cancelled' ||
    status === 'payment_failed' ||
    status === 'delivery_failed';
  const isOnTheRoad =
    status === 'heading_to_pickup' ||
    status === 'arrived_at_pickup' ||
    status === 'pickup_complete' ||
    status === 'arrived_at_drop' ||
    status === 'awaiting_payment';
  const isCancellable =
    isSearching || status === 'heading_to_pickup' || status === 'arrived_at_pickup';
  const showError = (error: unknown) => Alert.alert('Something went wrong', getErrorMessage(error));
  const etaCopy = liveEta ? liveEtaCopy(status, liveEta, order.stops.length > 1) : null;

  const handleContactDriver = () => {
    if (!order.driver?.phone) return;
    Linking.openURL(`tel:${order.driver.phone}`).catch(() => {
      Alert.alert('Unable to call', `Please dial ${order.driver?.phone} manually.`);
    });
  };

  const handleCancel = ({ code, text }: { code: string; text: string }) => {
    cancelOrder.mutate(
      { id: order.id, reasonCode: code, reasonText: text },
      {
        onSuccess: () => {
          setSheet(null);
          setShowCancelled(true);
        },
        onError: showError,
      },
    );
  };

  // Sends the receiver what they need at the door. The code still goes out if the link can't be made.
  const handleShare = async (stopId?: string, code = order.deliveryOtp) => {
    try {
      const link = await shareTracking.mutateAsync({ id: order.id, stopId });
      await shareTrackingLink(link, order.pickup.contact?.name || 'Someone', code);
    } catch {
      Share.share({
        message: code
          ? `Your RYNO delivery #${order.number} is on the way. Give this code to the driver only when you receive the parcel: ${code}`
          : `Your RYNO delivery #${order.number} has been booked.`,
      }).catch(() => {});
    }
  };

  // A finished order is a receipt, not a live map.
  if (isFinished) {
    return (
      <>
        <OrderDetails
          order={order}
          rating={userRating ?? order.rating}
          isRating={rateOrder.isPending}
          onBack={() => goBack(router)}
          onHelp={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
          onRate={(rating) =>
            rateOrder.mutate(
              { id: order.id, rating },
              {
                onSuccess: () => setUserRating(rating),
                onError: () =>
                  Alert.alert(
                    'Rating not saved',
                    'We could not save your rating right now. Please try again later.',
                  ),
              },
            )
          }
        />
        <BookingCancelledSheet
          visible={showCancelled}
          onClose={() => setShowCancelled(false)}
          orderNumber={order.number}
          fee={order.cancellationFee}
        />
      </>
    );
  }

  const paymentLabel = order.payment.methodLabel !== '—' ? order.payment.methodLabel : 'Cash';
  const paymentNote =
    order.payment.timing === 'on-pickup'
      ? 'Pay at pickup'
      : order.payment.timing === 'on-delivery'
        ? 'Pay at drop'
        : 'Payment method';

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      {/* The map fills the screen behind; the header sits above it on its own white bar. */}
      <AppView
        className="rounded-b-[24px] bg-canvas"
        style={{
          zIndex: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <ScreenHeader
          title={`Trip #${order.number}`}
          onBack={() => goBack(router)}
          className="pb-3"
          right={
            <AppPressable
              onPress={() => void handleShare()}
              disabled={shareTracking.isPending}
              accessibilityRole="button"
              accessibilityLabel="Share trip"
              className="flex-row items-center gap-1.5 rounded-full border border-brand px-3.5 py-2"
            >
              <Icon name="square.and.arrow.up" size={14} tone="brand" />
              <AppText className="text-[13px] font-bold text-brand-strong">Share</AppText>
            </AppPressable>
          }
        />
      </AppView>
      <TrackingMap
        map={map}
        vehicleName={order.vehicle.name}
        viaStops={order.route.slice(1, -1).map((point, i) => ({
          point,
          done: order.stops[i]?.status === 'completed',
        }))}
        bottomInset={sheetHeight}
      />

      <TrackingSheet>
        {orderQuery.isRefetchError ? (
          <AppPressable
            onPress={() => void orderQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Could not refresh order. Tap to retry."
            className="mb-3 rounded-2xl bg-surface-muted px-4 py-3"
          >
            <AppText className="text-[13px] text-muted">
              Couldn&apos;t refresh your order. Tap to try again.
            </AppText>
          </AppPressable>
        ) : null}

        {/* Status: keyed so each change fades in rather than swapping instantly. */}
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

        {/* Only useful until the driver enters it at pickup. */}
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
            onCall={order.driver?.phone ? handleContactDriver : undefined}
          />
        ) : null}

        {/* Stops, with the full trip one tap away. */}
        <AppView className="mt-4 rounded-[22px] bg-surface-muted p-4 pb-1">
          <OrderRoute order={order} compact />
          <AppPressable
            onPress={() => setSheet('details')}
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
            isSharing={shareTracking.isPending}
            onShare={() => void handleShare()}
          />
        ) : null}

        {/* Multi-stop: each stop's progress and its own code. */}
        {order.stops.length > 1 ? (
          <StopProgressList
            stops={order.stops}
            onShare={(stop) => void handleShare(stop.id, stop.code)}
          />
        ) : null}

        {/* Payment: the total only, never a breakdown. */}
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
          onPress={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
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
            onPress={() => setSheet('cancel')}
            disabled={cancelOrder.isPending}
            accessibilityRole="button"
            className="mt-2 items-center py-4"
          >
            <AppText className="text-[14px] font-bold text-danger">Cancel trip</AppText>
          </AppPressable>
        ) : null}
      </TrackingSheet>

      <TripDetailsSheet
        visible={sheet === 'details'}
        onClose={() => setSheet(null)}
        order={order}
      />
      <CancelTripSheet
        visible={sheet === 'cancel'}
        onClose={() => setSheet(null)}
        hasDriver={Boolean(order.driver)}
        isCancelling={cancelOrder.isPending}
        onSubmit={handleCancel}
      />
    </AppView>
  );
}
