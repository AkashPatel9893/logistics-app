import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAppRules, useRideQuote } from '@/hooks/use-catalog';
import { useDefaultPaymentMethod } from '@/hooks/use-wallet';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import { DURATION, staggerDelay } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { PaymentMethodButton } from './components/payment-method-button';
import { RideOptionRow } from './components/ride-option-row';
import { TripLocationsCard } from './components/trip-locations-card';
import { goBack } from '@/lib/go-back';

const ADDRESS_ERROR_CODES = new Set(['LOCATION_NOT_SERVICEABLE', 'CROSS_MARKET_ROUTE']);

export function TripConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();
  // The server's stop limit counts the pickup too.
  const maxDrops = useAppRules().maxOrderStops - 1;
  const paymentMethod = useDefaultPaymentMethod();
  const midRegions = draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : []));
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: midRegions,
    couponCode: draft.couponCode,
  });

  // A vehicle chosen earlier ("Book again") leads the list, so it's in view without scrolling. Fixed on arrival: rows must not move once the customer is tapping them.
  const [arrivalVehicleId] = useState(draft.selectedVehicleId);
  const options = [...(quote.data?.options ?? [])].sort(
    (a, b) => Number(b.vehicleId === arrivalVehicleId) - Number(a.vehicleId === arrivalVehicleId),
  );
  const selected =
    options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? options[0] ?? null;
  const distanceKm = quote.data?.distanceKm ?? null;

  const fallbackSender = user ? { name: user.name ?? '', phone: user.phone ?? '' } : null;

  const handleSwap = () => {
    const trip = useTripStore.getState();
    // The customer is the default sender; once the pickup becomes the drop they are its receiver.
    if (!trip.draft.pickupDetails && fallbackSender) {
      trip.setPickupDetails({
        contactName: fallbackSender.name,
        contactPhone: fallbackSender.phone,
        houseNumber: '',
      });
    }
    trip.swapPickupAndDrop();
  };

  const handleContinue = () => {
    if (!selected) return;
    // The first option is only a default until now: the next step books exactly this one.
    useTripStore.getState().setSelectedVehicle(selected.vehicleId);
    router.push('/review-booking');
  };

  // Like Porter: who and where at the top, then the vehicles. No map on this step.
  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader
        title="Select Vehicle"
        onBack={() => goBack(router)}
        className="pb-3"
        right={
          distanceKm !== null ? (
            <AppView className="rounded-full bg-surface px-3 py-2 shadow-xs">
              <AppText className="text-[13px] font-bold text-foreground">{distanceKm} km</AppText>
            </AppView>
          ) : null
        }
      />
      <TripLocationsCard
        draft={draft}
        fallbackSender={fallbackSender}
        onPickupPress={() =>
          router.push({ pathname: '/location-select', params: { target: 'pickup' } })
        }
        onDropPress={() =>
          draft.midStops.length > 0
            ? router.push({ pathname: '/add-stops', params: { mode: 'edit' } })
            : router.push('/location-select')
        }
        onSwap={handleSwap}
        onAddStop={
          draft.midStops.length + 1 < maxDrops
            ? () => router.push({ pathname: '/add-stops', params: { mode: 'add' } })
            : undefined
        }
        onEditLocations={() => router.push({ pathname: '/add-stops', params: { mode: 'edit' } })}
      />
      <AppScrollView contentContainerStyle={{ paddingTop: 8 }}>
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
      </AppScrollView>
      <AppView
        className="border-t border-divider bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
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
      </AppView>
    </AppView>
  );
}
