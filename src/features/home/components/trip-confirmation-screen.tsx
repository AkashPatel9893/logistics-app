import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import {
  Image as RNImage,
  ImageSourcePropType,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, Button, Card } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RideOption {
  id: string;
  name: string;
  description: string;
  etaMinutes: number;
  price: number;
  image: ImageSourcePropType;
}

type DeliveryTiming = 'on-delivery' | 'on-pickup';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PICKUP_LABEL = 'Hans Bhawan';
const DROP_LABEL = 'Unnamed Road, IP Estate';

const TRIP_ROUTE = [
  { latitude: 28.6385, longitude: 77.2405 },
  { latitude: 28.635, longitude: 77.239 },
  { latitude: 28.6317, longitude: 77.2415 },
  { latitude: 28.6321, longitude: 77.2455 },
  { latitude: 28.629, longitude: 77.248 },
];

const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'two-wheeler',
    name: 'Two-Wheeler',
    description: 'Up to 10 kg · Documents, food, small parcels',
    etaMinutes: 12,
    price: 620,
    image: require('@/assets/images/vehicles/bike.png'),
  },
  {
    id: 'three-wheeler',
    name: 'Three-Wheeler',
    description: 'Up to 150 kg · Medium boxes, small furniture',
    etaMinutes: 18,
    price: 620,
    image: require('@/assets/images/vehicles/pickup-truck.png'),
  },
  {
    id: 'e-rickshaw',
    name: 'E-Rickshaw',
    description: 'Up to 300 kg · City deliveries, medium loads',
    etaMinutes: 20,
    price: 620,
    image: require('@/assets/images/vehicles/e-rikshaw.png'),
  },
  {
    id: 'mini-truck',
    name: 'Mini Truck',
    description: 'Up to 600 kg · Home appliances, large cargo',
    etaMinutes: 25,
    price: 850,
    image: require('@/assets/images/vehicles/mini-truck.png'),
  },
];

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
  const [selectedVehicleId, setSelectedVehicleId] = useState(RIDE_OPTIONS[0].id);
  const [timing, setTiming] = useState<DeliveryTiming>('on-delivery');

  return (
    <AppView className="flex-1 bg-white dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 28.6335,
          longitude: 77.243,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Polyline coordinates={TRIP_ROUTE} strokeColor="#FF5A1F" strokeWidth={4} />
        <Marker coordinate={TRIP_ROUTE[0]} anchor={{ x: 0.5, y: 0.5 }}>
          <RouteMarker />
        </Marker>
        <Marker coordinate={TRIP_ROUTE[TRIP_ROUTE.length - 1]} anchor={{ x: 0.5, y: 0.5 }}>
          <RouteMarker />
        </Marker>
      </MapView>

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
            {PICKUP_LABEL}
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
            {DROP_LABEL}
          </AppText>
        </AppView>

        <AppView className="px-4 pt-3" style={{ flexShrink: 1 }}>
          {RIDE_OPTIONS.map((option) => (
            <RideOptionRow
              key={option.id}
              option={option}
              isSelected={selectedVehicleId === option.id}
              onPress={() => setSelectedVehicleId(option.id)}
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

          <Button label="Book Now" size="lg" className="rounded-2xl" />
        </AppView>
      </AppView>
    </AppView>
  );
}
