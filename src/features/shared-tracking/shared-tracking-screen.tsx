import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import {
  AnimatedView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
} from '@/components/ui';
import { DriverInfo } from '@/features/orders/components/driver-info';
import { TrackingHeader } from '@/features/orders/components/tracking-header';
import { TrackingMap } from '@/features/orders/components/tracking-map';
import { TrackingSheet } from '@/features/orders/components/tracking-sheet';
import { TrackingTimeline } from '@/features/orders/components/tracking-timeline';
import { buildTrackingMap } from '@/features/orders/hooks/use-order-tracking';
import { ORDER_STAGE_HEADLINE } from '@/features/orders/order-stage-labels';
import { getVehicleImage } from '@/features/trip/vehicle-catalog';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useSharedTracking } from '@/hooks/use-orders';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';
import { queryKeys } from '@/lib/queries/keys';
import { sharedTrackingChannel } from '@/lib/realtime/tracking-socket';

import { DeliveryOtpCard } from './components/delivery-otp-card';

/**
 * Receiver view, opened from a shared link without logging in: live status,
 * driver, and the delivery OTP to give the driver at drop.
 */
export function SharedTrackingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const trackingQuery = useSharedTracking(token);
  const tracking = trackingQuery.data;
  const isLive =
    tracking !== undefined && tracking.status !== 'delivered' && tracking.status !== 'cancelled';

  const liveLocation = useLiveTracking(
    token && isLive ? sharedTrackingChannel(token) : null,
    () => {
      if (token) queryClient.invalidateQueries({ queryKey: queryKeys.sharedTracking(token) });
    },
  );

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (trackingQuery.isPending) {
    return (
      <AppView center className="flex-1 bg-canvas">
        <FocusAwareStatusBar />
        <AppSpinner size="large" tone="brand" />
      </AppView>
    );
  }

  if (!tracking) {
    return (
      <AppView center className="flex-1 bg-canvas px-8">
        <FocusAwareStatusBar />
        <Icon name="lock.fill" size={28} tone="icon-subtle" />
        <AppText className="mt-3 text-center text-[17px] font-bold text-foreground">
          {getErrorMessage(trackingQuery.error)}
        </AppText>
        <AppText className="mt-1 text-center text-[13px] text-muted">
          Ask the sender to share a new tracking link.
        </AppText>
        <Button
          label="Try again"
          className="mt-6 self-stretch"
          loading={trackingQuery.isFetching}
          onPress={() => trackingQuery.refetch()}
        />
        <Button label="Close" variant="ghost" className="mt-2 self-stretch" onPress={close} />
      </AppView>
    );
  }

  const { status, driver } = tracking;
  const isOnTheWay =
    status === 'heading_to_pickup' ||
    status === 'arrived_at_pickup' ||
    status === 'pickup_complete' ||
    status === 'arrived_at_drop';

  const callDriver = () => {
    if (!driver) return;
    Linking.openURL(`tel:${driver.phone}`).catch(() =>
      Alert.alert('Unable to call', `Please dial ${driver.phone} manually.`),
    );
  };

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar style="light" />
      <TrackingHeader onBack={close} title={`Package from ${tracking.senderName}`} />
      <TrackingMap
        map={buildTrackingMap(status, tracking.route, liveLocation)}
        vehicleImage={getVehicleImage(tracking.vehicleImageKey)}
      />

      <TrackingSheet
        footer={
          isOnTheWay && driver ? (
            <Button
              label="Call driver"
              className="mt-4 border-promo bg-promo"
              textClassName="text-brand-foreground"
              onPress={callDriver}
              leftIcon={<Icon name="phone.fill" size={16} tone="brand-foreground" />}
            />
          ) : null
        }
      >
        <AppText className="text-[11px] font-bold uppercase tracking-widest text-subtle">
          Receiver · Order #{tracking.orderNumber}
        </AppText>
        <AnimatedView key={status} entering={FadeIn.duration(DURATION.enter)}>
          <AppText className="mt-1 text-[20px] font-extrabold text-foreground">
            {ORDER_STAGE_HEADLINE[status]}
          </AppText>
          <AppText numberOfLines={1} className="mt-1 text-[13px] text-muted">
            {tracking.pickupLabel} → {tracking.dropLabel}
          </AppText>
        </AnimatedView>

        {status !== 'delivered' && status !== 'cancelled' ? (
          <DeliveryOtpCard otp={tracking.deliveryOtp} />
        ) : null}

        {/* A cancelled order has released its driver. */}
        {status !== 'cancelled' ? <DriverInfo driver={driver} /> : null}
        <TrackingTimeline stage={status} />
      </TrackingSheet>
    </AppView>
  );
}
