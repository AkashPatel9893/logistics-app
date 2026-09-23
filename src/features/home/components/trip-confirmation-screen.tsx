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
} from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { METHOD_ICON } from '@/features/home/components/wallet-screen';
import { TRACKING_MOCK_DATA } from '@/features/home/mock-data';
import { getRideOptionById, RIDE_OPTIONS, type RideOption } from '@/features/home/vehicle-catalog';
import { cn } from '@/lib/cn';
import { computeBounds } from '@/lib/geo';
import { useOrdersStore } from '@/stores/orders-store';
import { useTripStore, type PickedRegion } from '@/stores/trip-store';
import { useWalletStore } from '@/stores/wallet-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type DeliveryTiming = 'on-delivery' | 'on-pickup';

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

function StopMarker() {
  return (
    <AppView className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center border-2 border-white" />
  );
}

interface RideOptionRowProps {
  option: RideOption;
  isSelected: boolean;
  onPress: () => void;
}

function RideOptionRow({ option, isSelected, onPress }: RideOptionRowProps) {
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
        <AppView className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center overflow-hidden mr-3">
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
          ₹{option.price}
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
  const [timing, setTiming] = useState<DeliveryTiming>('on-delivery');
  const [isBooking, setIsBooking] = useState(false);

  const selectedOption = getRideOptionById(selectedVehicleId) ?? RIDE_OPTIONS[0];
  const pickupLabel = draft.pickupLabel;
  const dropLabel = draft.dropLabel || 'Drop location';

  const paymentMethods = useWalletStore.use.paymentMethods();
  const selectedPaymentMethodId = useWalletStore.use.selectedPaymentMethodId();
  const selectedPaymentMethod =
    paymentMethods.find((m) => m.id === selectedPaymentMethodId) ?? paymentMethods[0];

  // Real pickup → stops → drop coordinates when every leg was actually geocoded.
  // Falls back to an illustrative route (no backend/GPS to source a real one
  // from) so the map preview always has something to show.
  const stopsWithRegion = draft.stops.filter(
    (stop): stop is typeof stop & { region: PickedRegion } => Boolean(stop.region),
  );
  const realWaypoints: PickedRegion[] = [
    draft.pickupRegion,
    ...draft.stops.map((stop) => stop.region),
    draft.dropRegion,
  ].filter((region): region is PickedRegion => Boolean(region));
  const hasRealRoute = realWaypoints.length >= 2;
  const routeCoordinates = hasRealRoute ? realWaypoints : FALLBACK_ROUTE;
  const routeBounds = computeBounds(routeCoordinates);
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
      stopLabels: draft.stops.map((stop) => stop.name),
      routeWaypoints: hasRealRoute ? realWaypoints : [],
      dropHouseNumber: draft.dropDetails?.houseNumber,
      dropLandmark: draft.dropDetails?.landmark,
      receiverName: draft.dropDetails?.receiverName,
      receiverPhone: draft.dropDetails?.receiverPhone,
      vehicleId: selectedOption.id,
      vehicleName: selectedOption.name,
      vehicleImageKey: selectedOption.id,
      price: selectedOption.price,
      etaMinutes: selectedOption.etaMinutes,
      paymentMethod: selectedPaymentMethod.label,
      timing,
    });

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
        {hasRealRoute &&
          stopsWithRegion.map((stop) => (
            <OlaMapMarker key={stop.id} coordinate={stop.region}>
              <StopMarker />
            </OlaMapMarker>
          ))}
        <OlaMapMarker coordinate={routeCoordinates[routeCoordinates.length - 1]}>
          <RouteMarker />
        </OlaMapMarker>
      </OlaMapView>

      {/* ── Header ── */}
      <AppView
        style={{ paddingTop: insets.top + 8, position: 'absolute', top: 0, left: 0, right: 0 }}
        className="flex-row items-center justify-between px-4"
      >
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppView className="bg-white dark:bg-neutral-900 rounded-full px-4 py-2.5 shadow-sm">
          <AppText className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
            Trip ID: #4492A
          </AppText>
        </AppView>
      </AppView>

      {/* ── Bottom sheet ── */}
      <AppView
        style={{ maxHeight: '62%' }}
        className="bg-white dark:bg-neutral-900 rounded-t-3xl pt-4"
      >
        {/* Stops (waypoints between pickup and drop) */}
        {draft.stops.length > 0 ? (
          <AppView className="flex-row items-center px-4 pb-2">
            <AppView className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />
            <AppText
              className="flex-1 text-[12px] text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Via {draft.stops.map((stop) => stop.name).join(' · ')}
            </AppText>
          </AppView>
        ) : null}

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

        {draft.dropDetails?.receiverName || draft.dropDetails?.receiverPhone ? (
          <AppView className="flex-row items-center px-4 pt-2 pb-1">
            <AppText
              className="flex-1 text-[12px] text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Contact:{' '}
              {[draft.dropDetails.receiverName, draft.dropDetails.receiverPhone]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </AppView>
        ) : null}

        <AppView style={{ height: 350 }}>
          <AppScrollView
            style={{ flexShrink: 1, flex: 1 }}
            className="px-4 pt-3"
            keyboardShouldPersistTaps="handled"
          >
            {RIDE_OPTIONS.map((option) => (
              <RideOptionRow
                key={option.id}
                option={option}
                isSelected={selectedVehicleId === option.id}
                onPress={() => {
                  setSelectedVehicleId(option.id);
                  useTripStore.getState().setSelectedVehicle(option.id);
                }}
              />
            ))}
          </AppScrollView>
        </AppView>

        {/* Footer: payment + timing + CTA */}
        <AppView
          style={{ paddingBottom: insets.bottom + 12 }}
          className="px-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <AppView className="flex-row items-center justify-between mb-3">
            <AppPressable
              onPress={() => router.push('/wallet')}
              className="flex-row items-center gap-1.5 py-2 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <Icon
                name={METHOD_ICON[selectedPaymentMethod.type].symbol as any}
                size={14}
                color="#FF5A1F"
              />
              <AppText
                className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
                numberOfLines={1}
              >
                {selectedPaymentMethod.label}
              </AppText>
              <Icon name="chevron.right" size={11} color="#9CA3AF" />
            </AppPressable>

            <AppView className="flex-row rounded-full bg-neutral-100 dark:bg-neutral-800 p-1">
              <AppPressable onPress={() => setTiming('on-delivery')}>
                <AppView
                  className={cn(
                    'px-3 py-1.5 rounded-full',
                    timing === 'on-delivery' && 'bg-[#FF5A1F]',
                  )}
                >
                  <AppText
                    className={cn(
                      'text-[12px] font-semibold',
                      timing === 'on-delivery'
                        ? 'text-white'
                        : 'text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    On Delivery
                  </AppText>
                </AppView>
              </AppPressable>
              <AppPressable onPress={() => setTiming('on-pickup')}>
                <AppView
                  className={cn(
                    'px-3 py-1.5 rounded-full',
                    timing === 'on-pickup' && 'bg-[#FF5A1F]',
                  )}
                >
                  <AppText
                    className={cn(
                      'text-[12px] font-semibold',
                      timing === 'on-pickup'
                        ? 'text-white'
                        : 'text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    On Pickup
                  </AppText>
                </AppView>
              </AppPressable>
            </AppView>
          </AppView>

          <Button
            label="Book Now"
            size="lg"
            className="rounded-2xl"
            loading={isBooking}
            onPress={handleBookNow}
          />
        </AppView>
      </AppView>
    </AppView>
  );
}
