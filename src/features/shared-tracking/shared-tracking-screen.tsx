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
import { TrackingSheet, useTrackingSheetHeight } from '@/features/orders/components/tracking-sheet';
import { TrackingTimeline } from '@/features/orders/components/tracking-timeline';
import { ORDER_STAGE_HEADLINE } from '@/features/orders/order-stage-labels';
import { DURATION, FadeIn } from '@/lib/motion';

import { DeliveryOtpCard } from './components/delivery-otp-card';
import { useSharedTrackingScreen } from './hooks/use-shared-tracking-screen';

export function SharedTrackingScreen() {
  const sheetHeight = useTrackingSheetHeight();
  const {
    tracking,
    map,
    isPending,
    isFetching,
    errorMessage,
    refetch,
    isOnTheWay,
    callDriver,
    close,
  } = useSharedTrackingScreen();

  if (isPending) {
    return (
      <AppView center className="flex-1 bg-canvas">
        <FocusAwareStatusBar />
        <AppSpinner size="large" tone="brand" />
      </AppView>
    );
  }

  if (!tracking || !map) {
    return (
      <AppView center className="flex-1 bg-canvas px-8">
        <FocusAwareStatusBar />
        <Icon name="lock.fill" size={28} tone="icon-subtle" />
        <AppText className="mt-3 text-center text-[17px] font-bold text-foreground">
          {errorMessage}
        </AppText>
        <AppText className="mt-1 text-center text-[13px] text-muted">
          Ask the sender to share a new tracking link.
        </AppText>
        <Button
          label="Try again"
          className="mt-6 self-stretch"
          loading={isFetching}
          onPress={() => refetch()}
        />
        <Button label="Close" variant="ghost" className="mt-2 self-stretch" onPress={close} />
      </AppView>
    );
  }

  const { status, driver } = tracking;

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar style="light" />
      <TrackingHeader onBack={close} title={`Package from ${tracking.senderName}`} />
      <TrackingMap map={map} vehicleName={tracking.vehicleName ?? ''} bottomInset={sheetHeight} />

      <TrackingSheet>
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

        {status !== 'cancelled' ? (
          <DriverInfo
            driver={driver}
            onCall={isOnTheWay && driver?.phone ? callDriver : undefined}
          />
        ) : null}
        <TrackingTimeline stage={status} />
      </TrackingSheet>
    </AppView>
  );
}
