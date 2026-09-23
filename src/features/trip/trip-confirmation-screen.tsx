import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppKeyboardAvoidingView,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
  SegmentedControl,
  type SegmentedOption,
} from '@/components/ui';
import { useRideQuote, useValidateCoupon } from '@/hooks/use-catalog';
import { useCreateOrder } from '@/hooks/use-orders';
import { useDefaultPaymentMethod } from '@/hooks/use-wallet';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import type { GeoPoint, PaymentTiming } from '@/lib/api/models';
import { DURATION, SHEET_EASE, staggerDelay } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { CouponField } from './components/coupon-field';
import { PaymentMethodButton } from './components/payment-method-button';
import { RideOptionRow } from './components/ride-option-row';
import { RoutePreviewMap } from './components/route-preview-map';
import { RouteSummary } from './components/route-summary';
import { PREVIEW_FALLBACK_ROUTE } from './vehicle-catalog';

const PAYMENT_TIMING_OPTIONS: readonly SegmentedOption<PaymentTiming>[] = [
  { value: 'on-pickup', label: 'Pay at pickup' },
  { value: 'on-delivery', label: 'Pay at drop' },
];

export function TripConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draft = useTripStore.use.draft();
  const paymentMethod = useDefaultPaymentMethod();
  const [timing, setTiming] = useState<PaymentTiming>('on-delivery');
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    couponCode: draft.couponCode,
  });
  const validateCoupon = useValidateCoupon();
  const createOrder = useCreateOrder();

  const options = quote.data?.options ?? [];
  const selected =
    options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? options[0] ?? null;
  const discount = selected?.coupon?.valid ? selected.coupon.discount : 0;
  const payable = selected ? selected.fare - discount : null;
  const distanceKm = quote.data?.distanceKm ?? null;
  const route: GeoPoint[] =
    draft.pickupRegion && draft.dropRegion
      ? [draft.pickupRegion, draft.dropRegion]
      : PREVIEW_FALLBACK_ROUTE;

  const handleApplyCoupon = async (code: string): Promise<string | null> => {
    try {
      const coupon = await validateCoupon.mutateAsync(code);
      useTripStore.getState().setCouponCode(coupon.code);
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

  const handleBook = () => {
    if (!selected || !paymentMethod || createOrder.isPending) return;
    createOrder.mutate(
      {
        pickup: {
          label: draft.pickupLabel,
          location: draft.pickupRegion,
          houseNumber: draft.pickupDetails?.houseNumber ?? '',
          contact: draft.pickupDetails
            ? { name: draft.pickupDetails.contactName, phone: draft.pickupDetails.contactPhone }
            : null,
        },
        drop: {
          label: draft.dropLabel || 'Drop location',
          location: draft.dropRegion,
          houseNumber: draft.dropDetails?.houseNumber ?? '',
          contact: draft.dropDetails
            ? { name: draft.dropDetails.contactName, phone: draft.dropDetails.contactPhone }
            : null,
        },
        vehicleId: selected.vehicleId,
        couponCode: draft.couponCode,
        paymentMethodId: paymentMethod.id,
        paymentTiming: timing,
      },
      {
        onSuccess: (order) => {
          useTripStore.getState().setCouponCode(null);
          // Drop the booking screens from history so "back" from tracking goes home.
          router.dismissAll();
          router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
        },
        onError: (error) =>
          Alert.alert(
            'Could not place order',
            error instanceof ApiError ? error.message : getErrorMessage(error),
          ),
      },
    );
  };

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      {/* Shrinks the map (not the sheet) when the coupon keyboard opens. */}
      <AppKeyboardAvoidingView>
        <RoutePreviewMap route={route} topInset={insets.top} />
        <AnimatedView
          entering={SlideInDown.duration(DURATION.sheet).easing(SHEET_EASE)}
          style={{ maxHeight: '62%' }}
          className="rounded-t-3xl bg-surface pt-4"
        >
          <RouteSummary draft={draft} />

          {/* Shrinks when the keyboard caps the sheet, keeping the coupon field above it. */}
          <AppView style={{ height: 250, flexShrink: 1 }}>
            <AppScrollView style={{ flexShrink: 1 }} className="px-4 pt-3">
              {quote.isPending ? (
                <AppView className="py-10">
                  <AppSpinner tone="brand" />
                </AppView>
              ) : quote.isError ? (
                <AppView className="items-center py-8">
                  <AppText className="text-center text-[13px] text-muted">
                    {getErrorMessage(quote.error)}
                  </AppText>
                  <Button
                    label="Try again"
                    variant="ghost"
                    size="sm"
                    onPress={() => quote.refetch()}
                  />
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
              <AppView className="h-4" />
            </AppScrollView>
          </AppView>

          <AppView
            style={{ paddingBottom: insets.bottom + 12 }}
            className="border-t border-divider bg-surface px-4 pt-3"
          >
            <CouponField
              appliedCode={draft.couponCode}
              check={selected?.coupon ?? null}
              onApply={handleApplyCoupon}
              onRemove={() => useTripStore.getState().setCouponCode(null)}
            />
            <SegmentedControl
              options={PAYMENT_TIMING_OPTIONS}
              value={timing}
              onChange={setTiming}
              style={{ marginBottom: 12 }}
              testID="payment-timing"
            />
            <AppView className="mb-3 h-16 w-full flex-row items-center justify-between gap-2">
              {paymentMethod ? (
                <PaymentMethodButton
                  method={paymentMethod}
                  onPress={() => router.push('/wallet')}
                />
              ) : (
                <AppView className="h-full flex-1 items-center justify-center rounded-2xl bg-surface-muted">
                  <AppSpinner />
                </AppView>
              )}
              <Button
                label={payable === null ? 'Book' : `Book · ₹${payable}`}
                className="h-full flex-1"
                disabled={!selected || !paymentMethod}
                loading={createOrder.isPending}
                onPress={handleBook}
              />
            </AppView>
          </AppView>
        </AnimatedView>
      </AppKeyboardAvoidingView>
      <ScreenHeader
        floating
        onBack={() => router.back()}
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
