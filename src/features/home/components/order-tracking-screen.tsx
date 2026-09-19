import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AppPressable, AppText, AppView, Button } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingStep {
  id: string;
  label: string;
  status: 'done' | 'current' | 'pending';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BOOKING_ID = 'MV-2048';
const ARRIVING_IN_MINUTES = 7;
const PICKUP_OTP = '0000';

const DRIVER = {
  name: 'Arun',
  rating: 4.9,
  vehicleLabel: 'Mini truck · KA 03 MX 2814',
};

const TRACKING_STEPS: TrackingStep[] = [
  { id: 'allocated', label: 'Driver allocated', status: 'done' },
  { id: 'heading-to-pickup', label: 'Heading to pickup', status: 'current' },
  { id: 'pickup-complete', label: 'Pickup complete', status: 'pending' },
  { id: 'delivered', label: 'Delivered', status: 'pending' },
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

function TrackingStepRow({ step }: { step: TrackingStep }) {
  const isComplete = step.status !== 'pending';

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
        <Polyline coordinates={TRIP_ROUTE} strokeColor="#FF5500" strokeWidth={4} />
        <Marker coordinate={TRIP_ROUTE[0]} anchor={{ x: 0.5, y: 0.5 }}>
          <DriverMarker />
        </Marker>
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
          Driver on the way
        </AppText>
        <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">
          Booking #{BOOKING_ID} · arriving in {ARRIVING_IN_MINUTES} min
        </AppText>
        <AppText className="text-[14px] font-bold text-[#FF5500] mt-2">
          Pickup OTP: {PICKUP_OTP}
        </AppText>

        {/* Driver info */}
        <AppView className="flex-row items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <Avatar name={DRIVER.name} size="lg" />
          <AppView className="ml-3 flex-1">
            <AppView className="flex-row items-center gap-1.5">
              <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                {DRIVER.name}
              </AppText>
              {Platform.OS === 'ios' ? (
                <SymbolView name="star.fill" size={12} tintColor="#FF5500" />
              ) : (
                <AppText style={{ fontSize: 12 }}>⭐</AppText>
              )}
              <AppText className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                {DRIVER.rating}
              </AppText>
            </AppView>
            <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {DRIVER.vehicleLabel}
            </AppText>
          </AppView>
        </AppView>

        {/* Status timeline */}
        <AppView className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {TRACKING_STEPS.map((step) => (
            <TrackingStepRow key={step.id} step={step} />
          ))}
        </AppView>

        {/* Footer actions */}
        <AppView className="flex-row gap-3 mt-4">
          <Button
            label="Contact Driver"
            size="lg"
            variant="primary"
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
            onPress={() => router.push('/home')}
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
