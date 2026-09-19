import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AppPressable, AppText, AppView, Button } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { cn } from '@/lib/cn';
import { resolveOrderStage, useOrdersStore, type OrderStage } from '@/stores/orders-store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingStep {
  id: OrderStage;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRACKING_STEPS: TrackingStep[] = [
  { id: 'searching', label: 'Finding your driver' },
  { id: 'heading_to_pickup', label: 'Heading to pickup' },
  { id: 'pickup_complete', label: 'Pickup complete' },
  { id: 'delivered', label: 'Delivered' },
];

const STAGE_ORDER: OrderStage[] = [
  'searching',
  'heading_to_pickup',
  'pickup_complete',
  'delivered',
];

const TRIP_ROUTE = [
  { latitude: 28.6507, longitude: 77.2334 },
  { latitude: 28.6455, longitude: 77.2378 },
  { latitude: 28.6395, longitude: 77.242 },
  { latitude: 28.6321, longitude: 77.2455 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DriverMarker() {
  return (
    <AppView className="w-9 h-9 rounded-full bg-neutral-900 items-center justify-center border-2 border-white">
      {Platform.OS === 'ios' ? (
        <SymbolView name="box.truck.fill" size={16} tintColor="#FFFFFF" />
      ) : (
        <AppText style={{ fontSize: 14 }}>🚚</AppText>
      )}
    </AppView>
  );
}

function TrackingStepRow({ step, currentIndex }: { step: TrackingStep; currentIndex: number }) {
  const stepIndex = STAGE_ORDER.indexOf(step.id);
  const isComplete = stepIndex <= currentIndex;

  return (
    <AppView className="flex-row items-center py-1.5">
      <AppView
        className={cn(
          'w-2.5 h-2.5 rounded-full mr-3',
          isComplete ? 'bg-[#FF5500]' : 'bg-neutral-200 dark:bg-neutral-700',
        )}
      />
      <AppText
        className={cn(
          'text-[14px]',
          isComplete
            ? 'font-semibold text-neutral-900 dark:text-neutral-100'
            : 'font-medium text-neutral-400 dark:text-neutral-500',
        )}
      >
        {step.label}
      </AppText>
    </AppView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const orders = useOrdersStore.use.orders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(intervalId);
  }, []);

  const order = orderId ? orders[orderId] : undefined;

  useEffect(() => {
    if (!order) return;
    const stage = resolveOrderStage(order, now);
    if (stage === 'delivered' && useOrdersStore.getState().activeOrderId === order.id) {
      useOrdersStore.getState().clearActiveOrder();
    }
  }, [order, now]);

  if (!order) {
    return (
      <AppView className="flex-1 bg-white dark:bg-neutral-950 items-center justify-center px-8">
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <AppText className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 text-center">
          We couldn&apos;t find that order
        </AppText>
        <Button
          label="Back to Home"
          size="lg"
          className="rounded-2xl mt-6 self-stretch"
          onPress={() => router.replace('/home')}
        />
      </AppView>
    );
  }

  const stage = resolveOrderStage(order, now);
  const currentIndex = STAGE_ORDER.indexOf(stage === 'cancelled' ? 'searching' : stage);
  const isSearching = stage === 'searching';
  const minutesUntilAllocation = Math.max(0, Math.ceil((order.driverAllocationAt - now) / 60_000));

  const statusHeadline = isSearching
    ? 'Finding a nearby driver'
    : stage === 'heading_to_pickup'
      ? 'Driver on the way'
      : stage === 'pickup_complete'
        ? 'Package picked up'
        : 'Delivered';

  const statusSubtext = isSearching
    ? `Matching you with a driver · ~${minutesUntilAllocation} min`
    : `Booking #${order.id.slice(-6).toUpperCase()} · ${order.vehicleName}`;

  return (
    <AppView className="flex-1 bg-white dark:bg-neutral-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Header banner ── */}
      <AppView
        style={{ paddingTop: insets.top + 8 }}
        className="bg-[#FF5500] rounded-b-[28px] px-5 pb-6"
      >
        <AppView className="mb-4">
          <LiquidGlassBackButton onPress={() => router.back()} size={40} controlSize="regular" />
        </AppView>
        <AppText className="text-[28px] leading-9 font-extrabold text-white tracking-tight">
          Track your package
        </AppText>
      </AppView>

      {/* ── Map ── */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 28.6425,
          longitude: 77.239,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
      >
        {!isSearching && (
          <>
            <Polyline coordinates={TRIP_ROUTE} strokeColor="#FF5500" strokeWidth={4} />
            <Marker coordinate={TRIP_ROUTE[0]} anchor={{ x: 0.5, y: 0.5 }}>
              <DriverMarker />
            </Marker>
          </>
        )}
      </MapView>

      {/* ── Bottom sheet ── */}
      <AppView
        style={{ paddingBottom: insets.bottom + 16 }}
        className="bg-white dark:bg-neutral-900 rounded-t-3xl px-5 pt-5"
      >
        <AppText className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
          Customer · Live tracking
        </AppText>
        <AppText className="text-[20px] font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
          {statusHeadline}
        </AppText>
        <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">
          {statusSubtext}
        </AppText>
        {!isSearching && (
          <AppText className="text-[14px] font-bold text-[#FF5500] mt-2">
            Pickup OTP: {order.pickupOtp}
          </AppText>
        )}

        {/* Driver info */}
        <AppView className="flex-row items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {isSearching ? (
            <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400">
              We&apos;ll show your driver&apos;s details as soon as one is assigned.
            </AppText>
          ) : (
            <>
              <Avatar name={order.driver.name} size="lg" />
              <AppView className="ml-3 flex-1">
                <AppView className="flex-row items-center gap-1.5">
                  <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                    {order.driver.name}
                  </AppText>
                  {Platform.OS === 'ios' ? (
                    <SymbolView name="star.fill" size={12} tintColor="#FF5500" />
                  ) : (
                    <AppText style={{ fontSize: 12 }}>⭐</AppText>
                  )}
                  <AppText className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                    {order.driver.rating}
                  </AppText>
                </AppView>
                <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {order.driver.vehicleLabel} · {order.driver.vehiclePlate}
                </AppText>
              </AppView>
            </>
          )}
        </AppView>

        {/* Status timeline */}
        <AppView className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {TRACKING_STEPS.map((step) => (
            <TrackingStepRow key={step.id} step={step} currentIndex={currentIndex} />
          ))}
        </AppView>

        {/* Footer actions */}
        <AppView className="flex-row gap-3 mt-4">
          <Button
            label="Contact Driver"
            size="lg"
            variant="primary"
            disabled={isSearching}
            className="flex-1 rounded-2xl bg-neutral-900 dark:bg-neutral-900 border-neutral-900"
            textClassName="text-white"
            leftIcon={
              Platform.OS === 'ios' ? (
                <SymbolView name="phone.fill" size={16} tintColor="#FFFFFF" />
              ) : (
                <AppText style={{ fontSize: 14 }}>📞</AppText>
              )
            }
          />
          <AppPressable
            onPress={() => router.replace('/home')}
            className="w-14 h-14 rounded-2xl bg-neutral-900 items-center justify-center"
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name="house.fill" size={18} tintColor="#FFFFFF" />
            ) : (
              <AppText style={{ fontSize: 16 }}>🏠</AppText>
            )}
          </AppPressable>
        </AppView>
      </AppView>
    </AppView>
  );
}
