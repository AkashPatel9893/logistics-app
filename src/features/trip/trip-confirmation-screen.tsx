import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAppRules, useRideQuote } from '@/hooks/use-catalog';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import { cn } from '@/lib/cn';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { DURATION, staggerDelay } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { formatFare, RideOptionRow } from './components/ride-option-row';
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
  const layoutTransition = useLayoutTransition();
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
      {/* Warm wash behind the header and locations card. */}
      <AppView className="absolute inset-x-0 top-0 h-72 bg-brand-soft" />
      <AppView className="absolute -right-20 -top-10 size-64 rounded-full bg-brand/[0.06]" />
      <ScreenHeader
        title="Select Vehicle"
        onBack={() => goBack(router)}
        className="pb-3"
        right={
          distanceKm !== null ? (
            <AppView row className="items-center gap-1 rounded-full bg-surface px-3 py-2">
              <Icon name="location.north.fill" size={12} tone="brand" />
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
      {/* Vehicles sit on a sheet, like Porter, under the locations card. */}
      <AppView
        className="mt-4 flex-1 overflow-hidden rounded-t-[30px] bg-surface"
        style={styles.sheetShadow}
      >
        <AppView center className="pb-1 pt-2.5">
          <AppView className="h-1 w-10 rounded-full bg-border" />
        </AppView>
        <AppView row className="items-center justify-between px-5 pb-1 pt-2">
          <AppText accessibilityRole="header" className="text-[17px] font-bold text-foreground">
            Choose your vehicle
          </AppText>
          {options.length > 0 ? (
            <AppText className="text-[12px] font-semibold text-muted">
              {options.length} available
            </AppText>
          ) : null}
        </AppView>
        <AppScrollView contentContainerStyle={{ paddingTop: 4 }}>
          <AppView className="px-3 pb-4 pt-2">
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
                  layout={layoutTransition}
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
      </AppView>
      <AppView
        className="border-t border-divider bg-surface px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {/* One clear next step, like Porter; payment is picked on the review screen. */}
        <AppPressable
          onPress={handleContinue}
          disabled={!selected}
          pressScale={0.98}
          accessibilityRole="button"
          accessibilityLabel={
            selected
              ? `Proceed with ${selected.name}, ${formatFare(selected.breakdown.total)}`
              : 'Choose a vehicle'
          }
          accessibilityState={{ disabled: !selected }}
          className={cn(
            'mb-1 h-[60px] flex-row items-center rounded-2xl pl-5 pr-2',
            selected ? 'bg-brand' : 'bg-surface-muted',
          )}
          style={selected ? styles.ctaShadow : undefined}
        >
          {selected ? (
            <AppView className="flex-1 pr-3">
              <AppText className="text-[11.5px] font-semibold text-brand-foreground/80">
                Proceed with
              </AppText>
              <AppText
                numberOfLines={1}
                className="text-[16px] font-bold leading-[20px] text-brand-foreground"
              >
                {selected.name}
              </AppText>
            </AppView>
          ) : (
            <AppText className="flex-1 pr-3 text-[16px] font-bold text-muted">
              Choose a vehicle
            </AppText>
          )}
          {selected ? (
            <AppView row className="h-10 items-center gap-1.5 rounded-xl bg-white/20 px-3">
              <AppText className="text-[16px] font-black tabular-nums text-brand-foreground">
                {formatFare(selected.breakdown.total)}
              </AppText>
              <Icon name="arrow.right" size={15} tone="brand-foreground" weight="bold" />
            </AppView>
          ) : null}
        </AppPressable>
      </AppView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  ctaShadow: {
    shadowColor: '#ff5a1f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  sheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 6,
  },
});
