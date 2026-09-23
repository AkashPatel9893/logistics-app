import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';
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
import { getDisplayName, useAuthStore } from '@/features/auth/use-auth-store';
import { getVehicleImage } from '@/features/trip/vehicle-catalog';
import { useCancelOrder, useRateOrder, useShareTracking } from '@/hooks/use-orders';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';

import { DeliveryRating } from './components/delivery-rating';
import { DriverInfo } from './components/driver-info';
import { ShareTrackingCard } from './components/share-tracking-card';
import { TrackingHeader } from './components/tracking-header';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet } from './components/tracking-sheet';
import { TrackingTimeline } from './components/tracking-timeline';
import { useOrderTracking } from './hooks/use-order-tracking';
import { ORDER_STAGE_HEADLINE } from './order-stage-labels';
import { shareTrackingLink } from './share-tracking';

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
  const user = useAuthStore.use.user();
  const { orderQuery, order, minutesUntilDriver, map } = useOrderTracking(orderId);
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const shareTracking = useShareTracking();

  if (orderQuery.isPending) {
    return (
      <CenteredMessage>
        <AppSpinner size="large" tone="brand" />
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
  const isOnTheRoad = status === 'heading_to_pickup' || status === 'pickup_complete';
  const isCancellable = isSearching || status === 'heading_to_pickup';
  const showError = (error: unknown) => Alert.alert('Something went wrong', getErrorMessage(error));

  const handleContactDriver = () => {
    if (!order.driver) return;
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

  const handleShare = () => {
    shareTracking.mutate(order.id, {
      onSuccess: (share) =>
        shareTrackingLink(share, order.pickup.contact?.name || getDisplayName(user)).catch(
          () => {},
        ),
      onError: showError,
    });
  };

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar style="light" />
      <TrackingHeader onBack={() => router.back()} />
      <TrackingMap map={map} vehicleImage={getVehicleImage(order.vehicle.imageKey)} />

      <TrackingSheet
        footer={
          <>
            <AppView className="mt-4 flex-row gap-3">
              <Button
                label="Contact Driver"
                className="flex-1 border-promo bg-promo"
                textClassName="text-brand-foreground"
                disabled={!order.driver || status === 'cancelled'}
                onPress={handleContactDriver}
                leftIcon={<Icon name="phone.fill" size={16} tone="brand-foreground" />}
              />
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
          </>
        }
      >
        <AppText className="text-[11px] font-bold uppercase tracking-widest text-subtle">
          Customer · Live tracking
        </AppText>
        {/* Keyed by status so each change fades in rather than swapping instantly. */}
        <AnimatedView key={status} entering={FadeIn.duration(DURATION.enter)}>
          <AppText className="mt-1 text-[20px] font-extrabold text-foreground">
            {ORDER_STAGE_HEADLINE[status]}
          </AppText>
          <AppText className="mt-1 text-[13px] text-muted">
            {isSearching
              ? `Matching you with a driver · ~${minutesUntilDriver} min`
              : `Booking #${order.number} · ${order.vehicle.name}`}
          </AppText>
        </AnimatedView>
        {/* Only useful until the driver enters it at pickup. */}
        {status === 'heading_to_pickup' ? (
          <AppText className="mt-2 text-[14px] font-bold text-brand">
            Pickup OTP: {order.pickupOtp}
          </AppText>
        ) : null}
        <AppText className="mt-1.5 text-[12px] text-muted">
          ₹{order.pricing.payable}
          {order.pricing.discount > 0 ? ` (saved ₹${order.pricing.discount})` : ''} ·{' '}
          {order.payment.methodLabel} ·{' '}
          {order.payment.timing === 'on-pickup' ? 'Pay at pickup' : 'Pay at drop'}
        </AppText>

        {isSearching || isOnTheRoad ? (
          <ShareTrackingCard
            deliveryOtp={order.deliveryOtp}
            isSharing={shareTracking.isPending}
            onShare={handleShare}
          />
        ) : null}

        {status === 'delivered' ? (
          <DeliveryRating
            driverName={order.driver?.name ?? 'your driver'}
            rating={order.rating}
            isSubmitting={rateOrder.isPending}
            onRate={(rating) => rateOrder.mutate({ id: order.id, rating }, { onError: showError })}
          />
        ) : null}

        {/* A cancelled order has released its driver. */}
        {status !== 'cancelled' ? <DriverInfo driver={order.driver} /> : null}
        <TrackingTimeline stage={status} />
      </TrackingSheet>
    </AppView>
  );
}
