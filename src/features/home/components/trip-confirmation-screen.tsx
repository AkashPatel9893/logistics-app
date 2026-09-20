import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Image as RNImage, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, Button, Card } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { TRACKING_MOCK_DATA } from '@/features/home/mock-data';
import { getRideOptionById, RIDE_OPTIONS, type RideOption } from '@/features/home/vehicle-catalog';
import { cn } from '@/lib/cn';
import { useOrdersStore } from '@/stores/orders-store';
import { useTripStore } from '@/stores/trip-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type DeliveryTiming = 'on-delivery' | 'on-pickup';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TRIP_ROUTE = TRACKING_MOCK_DATA.confirmationRoute;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RouteMarker() {
  return (
    <AppView className="w-8 h-8 rounded-full bg-neutral-900 items-center justify-center border-2 border-white">
      {Platform.OS === 'ios' ? (
        <SymbolView name="shippingbox.fill" size={14} tintColor="#FFFFFF" />
      ) : (
        <AppText style={{ fontSize: 12 }}>📦</AppText>
      )}
    </AppView>
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
          <RNImage source={option.image} style={{ width: 40, height: 40 }} resizeMode="contain" />
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
            {Platform.OS === 'ios' ? (
              <SymbolView name="clock" size={11} tintColor="#9CA3AF" />
            ) : (
              <AppText style={{ fontSize: 11 }}>🕐</AppText>
            )}
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

  const handleBookNow = () => {
    if (isBooking) return;
    setIsBooking(true);

    const orderId = useOrdersStore.getState().createOrder({
      pickupLabel,
      dropLabel,
      vehicleId: selectedOption.id,
      vehicleName: selectedOption.name,
      vehicleImageKey: selectedOption.id,
      price: selectedOption.price,
      etaMinutes: selectedOption.etaMinutes,
      paymentMethod: 'Cash',
      timing,
    });

    router.replace({ pathname: '/order-tracking', params: { orderId } });
  };

  return (
    <AppView className="flex-1 bg-white dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <OlaMapView style={{ flex: 1 }}>
        <OlaMapCamera initialViewState={{ center: [77.243, 28.6335], zoom: 15 }} />
        <OlaMapPolyline coordinates={TRIP_ROUTE} strokeColor="#FF5A1F" strokeWidth={4} />
        <OlaMapMarker coordinate={TRIP_ROUTE[0]}>
          <RouteMarker />
        </OlaMapMarker>
        <OlaMapMarker coordinate={TRIP_ROUTE[TRIP_ROUTE.length - 1]}>
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
            {Platform.OS === 'ios' ? (
              <SymbolView name="arrow.right" size={12} tintColor="#9CA3AF" />
            ) : (
              <AppText style={{ fontSize: 12, color: '#9CA3AF' }}>→</AppText>
            )}
          </AppView>
          <AppView className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F] mr-2" />
          <AppText
            className="flex-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {dropLabel}
          </AppText>
        </AppView>

        <AppView className="px-4 pt-3" style={{ flexShrink: 1 }}>
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
        </AppView>

        {/* Footer: payment + timing + CTA */}
        <AppView
          style={{ paddingBottom: insets.bottom + 12 }}
          className="px-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <AppView className="flex-row items-center justify-between mb-3">
            <TouchableOpacity className="flex-row items-center gap-1.5 py-2 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <AppText style={{ fontSize: 14 }}>💵</AppText>
              <AppText className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                Cash
              </AppText>
              {Platform.OS === 'ios' ? (
                <SymbolView name="chevron.right" size={11} tintColor="#9CA3AF" />
              ) : null}
            </TouchableOpacity>

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
