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
  Icon,
} from '@/components/ui';
import { useCancelOrder, useRateOrder } from '@/hooks/use-orders';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';

import { OrderDetails } from './components/order-details';
import { DriverInfo } from './components/driver-info';
import { ShareTrackingCard } from './components/share-tracking-card';
import { StopProgressList } from './components/stop-progress-list';
import { TrackingHeader } from './components/tracking-header';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet } from './components/tracking-sheet';
import { TrackingTimeline } from './components/tracking-timeline';
import { useOrderTracking } from './hooks/use-order-tracking';
import { ORDER_STAGE_HEADLINE } from './order-stage-labels';
import { goBack } from '@/lib/go-back';

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
  const { orderQuery, order, map } = useOrderTracking(orderId);
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const [userRating, setUserRating] = useState<number | null>(null);

  if (orderQuery.isPending) {
    return (
      <CenteredMessage>
        <AppSpinner size="large" tone="brand" />
      </CenteredMessage>
    );
  }

  if (orderQuery.isError) {
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

  const handleContactDriver = () => {
    if (!order.driver?.phone) return;
    Linking.openURL(`tel:${order.driver.phone}`).catch(() => {
      Alert.alert('Unable to call', `Please dial ${order.driver?.phone} manually.`);
    });
  };

  const handleCancel = () => {
    Alert.alert('Cancel this order?', 'Your driver will be released and no charge applies.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => cancelOrder.mutate(order.id, { onError: showError }),
      },
    ]);
  };

  // Sends the receiver what they need at the door. A live tracking link needs backend support.
  const handleShare = () => {
    if (!order.deliveryOtp) return;
    Share.share({
      message: `Your RYNO delivery #${order.number} is on the way. Give this code to the driver only when you receive the parcel: ${order.deliveryOtp}`,
    }).catch(() => {});
  };

  // A finished order is a receipt, not a live map.
  if (isFinished) {
    return (
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
    );
  }

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar style="light" />
      <TrackingHeader onBack={() => goBack(router)} />
      <TrackingMap
        map={map}
        vehicleName={order.vehicle.name}
        viaStops={order.route.slice(1, -1).map((point, i) => ({
          point,
          done: order.stops[i]?.status === 'completed',
        }))}
      />

      <TrackingSheet
        footer={
          <AppView collapsable={false}>
            <AppView collapsable={false} className="mt-4 flex-row gap-3">
              {isFinished ? (
                <AppView className="flex-1" />
              ) : (
                <Button
                  label="Contact Driver"
                  className="flex-1 border-promo bg-promo"
                  textClassName="text-brand-foreground"
                  disabled={!order.driver?.phone}
                  onPress={handleContactDriver}
                  leftIcon={<Icon name="phone.fill" size={16} tone="brand-foreground" />}
                />
              )}
              <AppPressable
                onPress={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
                accessibilityLabel="Help with this order"
                className="size-14 items-center justify-center rounded-2xl bg-surface-muted"
              >
                <Icon name="questionmark.circle" size={20} tone="brand" />
              </AppPressable>
              <AppPressable
                onPress={() => router.replace('/home')}
                accessibilityLabel="Go to home"
                className="size-14 items-center justify-center rounded-2xl bg-promo"
              >
                <Icon name="house.fill" size={18} tone="brand-foreground" />
              </AppPressable>
            </AppView>

            {isCancellable ? (
              <AppPressable
                onPress={handleCancel}
                disabled={cancelOrder.isPending}
                className="mt-3 self-center px-3 py-1.5"
              >
                <AppText className="text-[14px] font-semibold text-danger">
                  {cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
                </AppText>
              </AppPressable>
            ) : null}
          </AppView>
        }
      >
        <AppText className="text-[11px] font-bold uppercase tracking-widest text-subtle">
          Customer · Live tracking
        </AppText>
        {/* Keyed by status so each change fades in rather than swapping instantly. */}
        <AnimatedView key={status} entering={FadeIn.duration(DURATION.enter)}>
          <AppText className="mt-1 text-[20px] font-extrabold text-foreground">
            {order.noDriverFound ? 'No driver available yet' : ORDER_STAGE_HEADLINE[status]}
          </AppText>
          <AppText className="mt-1 text-[13px] text-muted">
            {order.noDriverFound
              ? 'No driver has accepted so far. You can keep waiting or cancel — no charge.'
              : isSearching
                ? 'Matching you with a nearby driver'
                : [`Booking #${order.number}`, order.vehicle.name].filter(Boolean).join(' · ')}
          </AppText>
        </AnimatedView>
        {/* Only useful until the driver enters it at pickup. */}
        {order.pickupOtp && (status === 'heading_to_pickup' || status === 'arrived_at_pickup') ? (
          <AppText className="mt-2 text-[14px] font-bold text-brand">
            Pickup OTP: {order.pickupOtp}
          </AppText>
        ) : null}
        <AppText className="mt-1.5 text-[12px] text-muted">
          {[
            order.pricing.payable != null
              ? `₹${order.pricing.payable.toFixed(2)}${
                  (order.pricing.discount ?? 0) > 0
                    ? ` (saved ₹${(order.pricing.discount ?? 0).toFixed(2)})`
                    : ''
                }`
              : 'Fare unavailable',
            // The method is only known once it is paid, so an unknown one is left out, not shown as "—".
            order.payment.methodLabel !== '—' ? order.payment.methodLabel : null,
            order.payment.timing === 'on-pickup'
              ? 'Pay at pickup'
              : order.payment.timing === 'on-delivery'
                ? 'Pay at drop'
                : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </AppText>

        {isSearching || isOnTheRoad ? (
          <ShareTrackingCard
            deliveryOtp={order.deliveryOtp}
            isSharing={false}
            onShare={handleShare}
          />
        ) : null}

        {/* Multi-stop: each stop's progress and its own code. */}
        {order.stops.length > 1 ? <StopProgressList stops={order.stops} /> : null}

        <DriverInfo driver={order.driver} />
        <TrackingTimeline stage={status} />
      </TrackingSheet>
    </AppView>
  );
}
