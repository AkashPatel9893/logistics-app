import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Share } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import {
  AnimatedView,
  AppPressable,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
} from '@/components/ui';
import { useCancelOrder, useRateOrder, useShareTracking } from '@/hooks/use-orders';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';

import { OrderDetails } from './components/order-details';
import { DriverInfo } from './components/driver-info';
import { OrderSummaryCard } from './components/order-summary-card';
import { ShareTrackingCard } from './components/share-tracking-card';
import { StopProgressList } from './components/stop-progress-list';
import { TrackingHeader } from './components/tracking-header';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet, useTrackingSheetHeight } from './components/tracking-sheet';
import { TrackingProgressBar, TrackingTimeline } from './components/tracking-timeline';
import { useOrderTracking } from './hooks/use-order-tracking';
import { liveEtaCopy, ORDER_STAGE_HEADLINE } from './order-stage-labels';
import { shareTrackingLink } from './share-tracking';
import { goBack } from '@/lib/go-back';
import { useTripStore } from '@/stores/trip-store';

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <AppView center className="flex-1 bg-canvas px-8">
      <FocusAwareStatusBar />
      {children}
    </AppView>
  );
}

export function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orderQuery, order, map, liveEta } = useOrderTracking(orderId);
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const shareTracking = useShareTracking();
  const [userRating, setUserRating] = useState<number | null>(null);
  const sheetHeight = useTrackingSheetHeight();

  if (orderQuery.isPending) {
    return (
      <CenteredMessage>
        <AppSpinner size="large" tone="brand" />
      </CenteredMessage>
    );
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
  const isFinished = status === 'delivered' || status === 'cancelled';
  const isOnTheRoad =
    status === 'heading_to_pickup' ||
    status === 'arrived_at_pickup' ||
    status === 'pickup_complete' ||
    status === 'arrived_at_drop';
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

  const handleCancel = () => {
    const consequence = order.driver
      ? 'Your driver will be released and no charge applies.'
      : 'We will stop looking for a driver. No charge applies.';
    Alert.alert('Cancel this order?', consequence, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => cancelOrder.mutate(order.id, { onError: showError }),
      },
    ]);
  };

  // Sends the receiver what they need at the door. The code still goes out if the link can't be made.
  const handleShare = async () => {
    if (!order.deliveryOtp) return;
    try {
      const link = await shareTracking.mutateAsync(order.id);
      await shareTrackingLink(link, order.pickup.contact?.name || 'Someone', order.deliveryOtp);
    } catch {
      Share.share({
        message: `Your RYNO delivery #${order.number} is on the way. Give this code to the driver only when you receive the parcel: ${order.deliveryOtp}`,
      }).catch(() => {});
    }
  };

  // Same route and vehicle, one tap from the address screen.
  const handleBookAgain = () => {
    const trip = useTripStore.getState();
    trip.resetDraft();
    trip.setPickup(order.pickup.label, order.route[0], order.pickup.label);
    trip.setDrop(order.drop.label, order.route[order.route.length - 1], order.drop.label);
    trip.setSelectedVehicle(order.vehicle.id);
    router.push('/location-select');
  };

  // A finished order is a receipt, not a live map.
  if (isFinished) {
    return (
      <OrderDetails
        order={order}
        rating={userRating ?? order.rating}
        isRating={rateOrder.isPending}
        onBack={() => goBack(router)}
        onBookAgain={handleBookAgain}
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
    );
  }

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar style="light" />
      <TrackingHeader
        onBack={() => goBack(router)}
        onHelp={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
      />
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
        {/* Keyed by status so each change fades in rather than swapping instantly. */}
        <AnimatedView key={status} entering={FadeIn.duration(DURATION.enter)}>
          <AppText className="text-[20px] font-extrabold text-foreground">
            {order.noDriverFound
              ? 'No driver available yet'
              : (etaCopy?.headline ?? ORDER_STAGE_HEADLINE[status])}
          </AppText>
          <AppText className="mt-1 text-[13px] text-muted">
            {order.noDriverFound
              ? 'No driver has accepted so far. You can keep waiting or cancel — no charge.'
              : isSearching
                ? 'Matching you with a nearby driver'
                : (etaCopy?.detail ??
                  [`Booking #${order.number}`, order.vehicle.name].filter(Boolean).join(' · '))}
          </AppText>
        </AnimatedView>
        <TrackingProgressBar stage={status} />

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

        {order.noDriverFound ? (
          // Waiting has run out of road here, so this is the one time cancelling stays in view.
          <Button
            label={cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
            variant="ghost"
            className="mt-3"
            textClassName="text-danger"
            disabled={cancelOrder.isPending}
            onPress={handleCancel}
          />
        ) : (
          <DriverInfo
            driver={order.driver}
            searching={isSearching}
            onCall={order.driver?.phone ? handleContactDriver : undefined}
          />
        )}

        {order.deliveryOtp && isOnTheRoad ? (
          <ShareTrackingCard
            deliveryOtp={order.deliveryOtp}
            isSharing={shareTracking.isPending}
            onShare={handleShare}
          />
        ) : null}

        {/* Multi-stop: each stop's progress and its own code. */}
        {order.stops.length > 1 ? <StopProgressList stops={order.stops} /> : null}

        <OrderSummaryCard order={order} />
        <TrackingTimeline stage={status} />

        {isCancellable && !order.noDriverFound ? (
          <AppPressable
            onPress={handleCancel}
            disabled={cancelOrder.isPending}
            className="mt-4 flex-row items-center justify-between border-t border-divider py-4"
          >
            <AppText className="text-[14px] font-semibold text-danger">
              {cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
            </AppText>
            <AppText className="text-[12px] text-muted">No charge</AppText>
          </AppPressable>
        ) : null}
      </TrackingSheet>
    </AppView>
  );
}
