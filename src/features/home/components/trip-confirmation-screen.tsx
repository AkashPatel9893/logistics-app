import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppImage,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  Card,
  Icon,
  SegmentedControl,
  type SegmentedOption,
} from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { METHOD_ICON } from '@/features/home/components/wallet-screen';
import { applyCoupon, getCouponByCode } from '@/features/home/coupons';
import { TRACKING_MOCK_DATA } from '@/features/home/mock-data';
import {
  estimateFare,
  estimateRoadDistanceKm,
  getRideOptionById,
  RIDE_OPTIONS,
  type RideOption,
} from '@/features/home/vehicle-catalog';
import { cn } from '@/lib/cn';
import { computeBounds, pathDistanceKm } from '@/lib/geo';
import { useOrdersStore, type PaymentTiming } from '@/stores/orders-store';
import { useTripStore, type PickedRegion } from '@/stores/trip-store';
import { useWalletStore } from '@/stores/wallet-store';

const PAYMENT_TIMING_OPTIONS: SegmentedOption<PaymentTiming>[] = [
  { value: 'on-pickup', label: 'Pay at pickup' },
  { value: 'on-delivery', label: 'Pay at drop' },
];

// Illustrative fallback route — there's no real backend/GPS, so a trip whose
// address didn't geocode still gets a route to preview on the map.
const FALLBACK_ROUTE = TRACKING_MOCK_DATA.confirmationRoute;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RouteMarker() {
  return (
    <AppView className="w-8 h-8 rounded-full bg-neutral-900 items-center justify-center border-2 border-white">
      <Icon name="shippingbox.fill" size={14} color="#FFFFFF" />
    </AppView>
  );
}

interface RideOptionRowProps {
  option: RideOption;
  fare: number;
  isSelected: boolean;
  onPress: () => void;
}

function RideOptionRow({ option, fare, isSelected, onPress }: RideOptionRowProps) {
  return (
    <AppPressable onPress={onPress} className="mb-3">
      <Card
        variant={isSelected ? 'default' : 'outline'}
        className={cn(
          'flex-row items-center p-3',
          isSelected
            ? 'border-[#FF5A1F] bg-orange-50/40 dark:bg-orange-950/20'
            : 'border-neutral-100 dark:border-neutral-800',
        )}
      >
        <AppView className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-800 items-center justify-center overflow-hidden mr-3">
          <AppImage source={option.image} style={{ width: 40, height: 40 }} contentFit="contain" />
        </AppView>

        <AppView className="flex-1">
          <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
            {option.name}
          </AppText>
          <AppText
            className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5"
            numberOfLines={1}
          >
            {option.description}
          </AppText>
          <AppView className="flex-row items-center mt-1 gap-1">
            <Icon name="clock" size={11} color="#9CA3AF" />
            <AppText className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {option.etaMinutes} min
            </AppText>
          </AppView>
        </AppView>

        <AppText className="text-[16px] font-bold text-neutral-900 dark:text-neutral-100">
          ₹{fare}
        </AppText>
      </Card>
    </AppPressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function TripConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draft = useTripStore.use.draft();
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    () => getRideOptionById(draft.selectedVehicleId ?? '')?.id ?? RIDE_OPTIONS[0].id,
  );
  const [timing, setTiming] = useState<PaymentTiming>('on-delivery');
  const [isBooking, setIsBooking] = useState(false);

  const selectedOption = getRideOptionById(selectedVehicleId) ?? RIDE_OPTIONS[0];
  const pickupLabel = draft.pickupLabel;
  const dropLabel = draft.dropLabel || 'Drop location';

  const paymentMethods = useWalletStore.use.paymentMethods();
  const selectedPaymentMethodId = useWalletStore.use.selectedPaymentMethodId();
  const selectedPaymentMethod =
    paymentMethods.find((m) => m.id === selectedPaymentMethodId) ?? paymentMethods[0];

  // Real pickup → drop coordinates when both legs were actually geocoded.
  // Falls back to an illustrative route (no backend/GPS to source a real one
  // from) so the map preview always has something to show.
  const realWaypoints: PickedRegion[] = [draft.pickupRegion, draft.dropRegion].filter(
    (region): region is PickedRegion => Boolean(region),
  );
  const hasRealRoute = realWaypoints.length >= 2;
  const routeCoordinates = hasRealRoute ? realWaypoints : FALLBACK_ROUTE;
  const routeBounds = computeBounds(routeCoordinates);

  // Prototype pricing: distance-based fare from the real pickup → drop points
  // when both geocoded; otherwise each option's flat fallback price.
  const roadDistanceKm = hasRealRoute
    ? estimateRoadDistanceKm(pathDistanceKm(realWaypoints))
    : null;
  const fare = estimateFare(selectedOption, roadDistanceKm);

  const coupon = getCouponByCode(draft.couponCode);
  const couponResult = coupon ? applyCoupon(coupon, fare, selectedOption.id) : null;
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const payable = fare - discount;
  // The map is its own flex:1 area above the bottom sheet (not overlaid by
  // it), so padding only needs to keep markers off the map's own edges —
  // plus extra top clearance for the floating header pill.
  const mapPadding = { top: insets.top + 70, left: 50, right: 50, bottom: 40 };

  const handleBookNow = () => {
    if (isBooking) return;
    setIsBooking(true);

    const orderId = useOrdersStore.getState().createOrder({
      pickupLabel,
      dropLabel,
      routeWaypoints: hasRealRoute ? realWaypoints : [],
      dropHouseNumber: draft.dropDetails?.houseNumber,
      receiverName: draft.dropDetails?.receiverName,
      receiverPhone: draft.dropDetails?.receiverPhone,
      vehicleId: selectedOption.id,
      vehicleName: selectedOption.name,
      vehicleImageKey: selectedOption.id,
      price: payable,
      discount,
      couponCode: discount > 0 ? (coupon?.code ?? null) : null,
      distanceKm: roadDistanceKm,
      etaMinutes: selectedOption.etaMinutes,
      paymentMethod: selectedPaymentMethod.label,
      timing,
    });
    useTripStore.getState().setCouponCode(null);

    router.replace({ pathname: '/order-tracking', params: { orderId } });
  };

  return (
    <AppView className="flex-1 bg-white dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <OlaMapView style={{ flex: 1 }}>
        <OlaMapCamera
          initialViewState={{
            bounds: routeBounds,
            padding: mapPadding,
          }}
        />
        <OlaMapPolyline coordinates={routeCoordinates} strokeColor="#FF5A1F" strokeWidth={4} />
        <OlaMapMarker coordinate={routeCoordinates[0]}>
          <RouteMarker />
        </OlaMapMarker>
        <OlaMapMarker coordinate={routeCoordinates[routeCoordinates.length - 1]}>
          <RouteMarker />
        </OlaMapMarker>
      </OlaMapView>

      {/* ── Header ── */}
      <AppView
        style={{
          paddingTop: insets.top + 8,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          elevation: 10,
        }}
        className="flex-row items-center justify-between px-4"
      >
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        {roadDistanceKm !== null && (
          <AppView className="bg-white dark:bg-neutral-900 rounded-full px-4 py-2.5 shadow-sm">
            <AppText className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
              {roadDistanceKm} km
            </AppText>
          </AppView>
        )}
      </AppView>

      {/* ── Bottom sheet ── */}
      <AppView
        style={{ maxHeight: '62%' }}
        className="bg-white dark:bg-neutral-900 rounded-t-3xl pt-4"
      >
        {/* Route summary */}
        <AppView className="flex-row items-center px-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <AppView className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
          <AppText
            className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {pickupLabel}
          </AppText>
          <AppView className="mx-2">
            <Icon name="arrow.right" size={12} color="#9CA3AF" />
          </AppView>
          <AppView className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F] mr-2" />
          <AppText
            className="flex-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {dropLabel}
          </AppText>
        </AppView>

        {draft.pickupDetails?.senderName || draft.pickupDetails?.senderPhone ? (
          <AppView className="flex-row items-center px-4 pt-2 pb-1">
            <AppText
              className="flex-1 text-[12px] text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Sender:{' '}
              {[draft.pickupDetails.senderName, draft.pickupDetails.senderPhone]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </AppView>
        ) : null}

        {draft.dropDetails?.receiverName || draft.dropDetails?.receiverPhone ? (
          <AppView className="flex-row items-center px-4 pt-2 pb-1">
            <AppText
              className="flex-1 text-[12px] text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Receiver:{' '}
              {[draft.dropDetails.receiverName, draft.dropDetails.receiverPhone]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </AppView>
        ) : null}

        <AppView style={{ height: 250 }}>
          <AppScrollView
            style={{ flexShrink: 1, flex: 1 }}
            className="px-4 pt-3"
            keyboardShouldPersistTaps="handled"
          >
            {RIDE_OPTIONS.map((option) => (
              <RideOptionRow
                key={option.id}
                option={option}
                fare={estimateFare(option, roadDistanceKm)}
                isSelected={selectedVehicleId === option.id}
                onPress={() => {
                  setSelectedVehicleId(option.id);
                  useTripStore.getState().setSelectedVehicle(option.id);
                }}
              />
            ))}

            <AppView className="h-4" />
          </AppScrollView>
        </AppView>

        {/* Footer: coupon + payment timing + payment method + CTA */}
        <AppView
          style={{ paddingBottom: insets.bottom + 12 }}
          className="px-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <AppPressable
            onPress={() => router.push('/coupons')}
            accessibilityRole="button"
            accessibilityLabel={coupon ? `Coupon ${coupon.code}. Change coupon` : 'Apply coupon'}
            className="flex-row items-center mb-3 px-3 py-2.5 rounded-2xl border border-dashed border-orange-300 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20"
          >
            <Icon name="tag.fill" size={15} color="#FF5A1F" />
            <AppView className="flex-1 ml-2">
              <AppText className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                {coupon ? coupon.code : 'Apply coupon'}
              </AppText>
              {couponResult && (
                <AppText
                  className={cn(
                    'text-[12px] mt-0.5',
                    couponResult.ok ? 'text-green-600' : 'text-red-500',
                  )}
                >
                  {couponResult.ok ? `You save ₹${couponResult.discount}` : couponResult.reason}
                </AppText>
              )}
            </AppView>
            <Icon name="chevron.right" size={14} color="#9CA3AF" />
          </AppPressable>

          <SegmentedControl
            options={PAYMENT_TIMING_OPTIONS}
            value={timing}
            onChange={setTiming}
            style={{ marginBottom: 12 }}
            testID="payment-timing"
          />

          <AppView className="flex-row items-center justify-between mb-3 h-16 gap-2 w-full">
            <AppPressable
              onPress={() => router.push('/wallet')}
              className="flex-row items-center justify-center gap-1.5 h-full flex-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800"
            >
              <Icon
                name={METHOD_ICON[selectedPaymentMethod.type].symbol as any}
                size={16}
                color="#FF5A1F"
              />
              <AppText
                className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100"
                numberOfLines={1}
              >
                {selectedPaymentMethod.label}
              </AppText>
              <Icon name="chevron.right" size={14} color="#9CA3AF" />
            </AppPressable>

            <Button
              label={`Book · ₹${payable}`}
              size="lg"
              className="rounded-2xl h-full flex-1"
              loading={isBooking}
              onPress={handleBookNow}
            />
          </AppView>
        </AppView>
      </AppView>
    </AppView>
  );
}
