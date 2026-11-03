import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapSheet, useMapSheetHeight } from '@/components/map-sheet';
import {
  AnimatedView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
} from '@/components/ui';
import { useRideQuote } from '@/hooks/use-catalog';
import { useDefaultPaymentMethod } from '@/hooks/use-wallet';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import type { GeoPoint } from '@/lib/api/models';
import { DURATION, staggerDelay } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { PaymentMethodButton } from './components/payment-method-button';
import { RideOptionRow } from './components/ride-option-row';
import { RoutePreviewMap } from './components/route-preview-map';
import { RouteSummary } from './components/route-summary';
import { goBack } from '@/lib/go-back';

/** Fits two vehicles and the actions at rest; the map stays the biggest thing on screen. */
const RESTING_CONTENT_HEIGHT = 360;
const RESTING_MAX_SHARE = 0.52;
const ADDRESS_ERROR_CODES = new Set(['LOCATION_NOT_SERVICEABLE', 'CROSS_MARKET_ROUTE']);

export function TripConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetHeight = useMapSheetHeight(RESTING_CONTENT_HEIGHT, RESTING_MAX_SHARE);
  const draft = useTripStore.use.draft();
  const paymentMethod = useDefaultPaymentMethod();
  const midRegions = draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : []));
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: midRegions,
    couponCode: draft.couponCode,
  });

  // A vehicle chosen earlier ("Book again") leads the list, so it's in view at the sheet's resting
  // height. Fixed on arrival: rows must not move once the customer is tapping them.
  const [arrivalVehicleId] = useState(draft.selectedVehicleId);
  const options = [...(quote.data?.options ?? [])].sort(
    (a, b) => Number(b.vehicleId === arrivalVehicleId) - Number(a.vehicleId === arrivalVehicleId),
  );
  const selected =
    options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? options[0] ?? null;
  const distanceKm = quote.data?.distanceKm ?? null;
  const route: GeoPoint[] =
    draft.pickupRegion && draft.dropRegion
      ? [draft.pickupRegion, ...midRegions, draft.dropRegion]
      : [];

  const handleContinue = () => {
    if (!selected) return;
    // The first option is only a default until now: the next step books exactly this one.
    useTripStore.getState().setSelectedVehicle(selected.vehicleId);
    router.push('/review-booking');
  };

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      {route.length > 1 ? (
        <RoutePreviewMap route={route} topInset={insets.top} bottomInset={sheetHeight} />
      ) : (
        <AppView className="flex-1 items-center justify-center">
          <AppText className="text-muted">Route unavailable</AppText>
        </AppView>
      )}
      <MapSheet
        collapsedHeight={sheetHeight}
        header={<RouteSummary draft={draft} compact />}
        footer={
          <AppView className="mb-1 h-14 w-full flex-row items-center justify-between gap-2">
            {paymentMethod ? (
              <PaymentMethodButton method={paymentMethod} onPress={() => router.push('/wallet')} />
            ) : (
              <AppView className="h-full flex-1 items-center justify-center rounded-2xl bg-surface-muted">
                <AppSpinner />
              </AppView>
            )}
            <Button
              label={selected ? `Continue · ₹${selected.breakdown.total.toFixed(2)}` : 'Continue'}
              className="h-full flex-[1.4]"
              disabled={!selected}
              onPress={handleContinue}
            />
          </AppView>
        }
      >
        <AppView className="px-4 pb-4 pt-3">
          {quote.isPending ? (
            <AppView className="py-10">
              <AppSpinner tone="brand" />
            </AppView>
          ) : quote.isError ? (
            <AppView className="items-center py-8">
              <AppText className="text-center text-[13px] text-muted">
                {getErrorMessage(quote.error)}
              </AppText>
              {/* Retrying can't help when the addresses themselves are the problem. */}
              {quote.error instanceof ApiError &&
              ADDRESS_ERROR_CODES.has(quote.error.code ?? '') ? (
                <Button
                  label="Change address"
                  variant="ghost"
                  size="sm"
                  onPress={() => goBack(router)}
                />
              ) : (
                <Button
                  label="Try again"
                  variant="ghost"
                  size="sm"
                  onPress={() => quote.refetch()}
                />
              )}
            </AppView>
          ) : (
            options.map((option, index) => (
              <AnimatedView
                key={option.vehicleId}
                entering={FadeIn.duration(DURATION.enter).delay(staggerDelay(index))}
              >
                <RideOptionRow
                  option={option}
                  isSelected={selected?.vehicleId === option.vehicleId}
                  onPress={() => useTripStore.getState().setSelectedVehicle(option.vehicleId)}
                />
              </AnimatedView>
            ))
          )}
        </AppView>
      </MapSheet>
      <ScreenHeader
        floating
        onBack={() => goBack(router)}
        right={
          distanceKm !== null ? (
            <AppView className="rounded-full bg-surface px-4 py-2.5 shadow-sm">
              <AppText className="text-[13px] font-bold text-foreground">{distanceKm} km</AppText>
            </AppView>
          ) : null
        }
      />
    </AppView>
  );
}
