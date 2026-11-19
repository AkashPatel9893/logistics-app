import { useState } from 'react';

import {
  AppPressable,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import { Alert, openExternalUrl, shareText } from '@/lib/native';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useCancelOrder, useRateOrder, useShareTracking } from '@/queries';

import { OrderDetails } from './components/order-details';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet, useTrackingSheetHeight } from './components/tracking-sheet';
import { TrackingSheetContent } from './components/tracking-sheet-content';
import { BookingCancelledSheet, CancelTripSheet, TripDetailsSheet } from './components/trip-sheets';
import { useOrderTracking } from './hooks/use-order-tracking';
import { shareTrackingLink } from './share-tracking';

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <AppView center className="flex-1 bg-canvas px-8">
      <FocusAwareStatusBar />
      {children}
    </AppView>
  );
}

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
    status === 'searching' || status === 'heading_to_pickup' || status === 'arrived_at_pickup';
  const showError = (error: unknown) => Alert.alert('Something went wrong', getErrorMessage(error));

  const handleContactDriver = () => {
    if (!order.driver?.phone) return;
    openExternalUrl(
      `tel:${order.driver.phone}`,
      `Please dial ${order.driver.phone} manually.`,
      'Unable to call',
    );
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

  const handleShare = async (stopId?: string, code = order.deliveryOtp) => {
    try {
      const link = await shareTracking.mutateAsync({ id: order.id, stopId });
      await shareTrackingLink(link, order.pickup.contact?.name || 'Someone', code);
    } catch {
      await shareText(
        code
          ? `Your RYNO delivery #${order.number} is on the way. Give this code to the driver only when you receive the parcel: ${code}`
          : `Your RYNO delivery #${order.number} has been booked.`,
      );
    }
  };

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

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <AppView className="z-10 rounded-b-[24px] bg-canvas shadow-header-bar">
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
        <TrackingSheetContent
          order={order}
          liveEta={liveEta}
          locationStale={locationStale}
          isRefetchError={orderQuery.isRefetchError}
          isSharing={shareTracking.isPending}
          isCancelling={cancelOrder.isPending}
          isCancellable={isCancellable}
          isOnTheRoad={isOnTheRoad}
          onRetryRefresh={() => void orderQuery.refetch()}
          onContactDriver={handleContactDriver}
          onOpenDetails={() => setSheet('details')}
          onShare={(stopId, code) => void handleShare(stopId, code)}
          onOpenSupport={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
          onOpenCancel={() => setSheet('cancel')}
        />
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
