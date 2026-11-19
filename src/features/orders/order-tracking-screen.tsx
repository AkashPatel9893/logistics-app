import { useState } from 'react';

import {
  AppPressable,
  AppText,
  AppView,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';

import { OrderDetails } from './components/order-details';
import { TrackingMap } from './components/tracking-map';
import { TrackingSheet, useTrackingSheetHeight } from './components/tracking-sheet';
import { TrackingSheetContent } from './components/tracking-sheet-content';
import {
  TrackingErrorState,
  TrackingNotFoundState,
  TrackingSkeleton,
} from './components/tracking-status-fallback';
import { BookingCancelledSheet, CancelTripSheet, TripDetailsSheet } from './components/trip-sheets';
import { useOrderTracking } from './hooks/use-order-tracking';
import { useOrderTrackingActions } from './hooks/use-order-tracking-actions';
import { isCancellableOrder, isFinishedOrder, isOnTheRoadOrder } from './order-stage-labels';

export function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orderQuery, order, map, liveEta, locationStale } = useOrderTracking(orderId);
  const [sheet, setSheet] = useState<'details' | 'cancel' | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const sheetHeight = useTrackingSheetHeight();
  const actions = useOrderTrackingActions(order, {
    onCancelled: () => {
      setSheet(null);
      setShowCancelled(true);
    },
  });

  if (orderQuery.isPending) return <TrackingSkeleton onBack={() => goBack(router)} />;

  if (orderQuery.isError && !order) {
    return (
      <TrackingErrorState
        error={orderQuery.error}
        orderId={orderId}
        onRetry={() => void orderQuery.refetch()}
        onHome={() => router.replace('/home')}
      />
    );
  }

  if (!order) return <TrackingNotFoundState onHome={() => router.replace('/home')} />;

  if (isFinishedOrder(order.status)) {
    return (
      <>
        <OrderDetails
          order={order}
          rating={actions.userRating ?? order.rating}
          isRating={actions.isRating}
          onBack={() => goBack(router)}
          onHelp={() => router.push({ pathname: '/support', params: { orderId: order.id } })}
          onRate={actions.handleRate}
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
              onPress={() => void actions.handleShare()}
              disabled={actions.isSharing}
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
          isSharing={actions.isSharing}
          isCancelling={actions.isCancelling}
          isCancellable={isCancellableOrder(order.status)}
          isOnTheRoad={isOnTheRoadOrder(order.status)}
          onRetryRefresh={() => void orderQuery.refetch()}
          onContactDriver={actions.handleContactDriver}
          onOpenDetails={() => setSheet('details')}
          onShare={(stopId, code) => void actions.handleShare(stopId, code)}
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
        isCancelling={actions.isCancelling}
        onSubmit={actions.handleCancel}
      />
    </AppView>
  );
}
