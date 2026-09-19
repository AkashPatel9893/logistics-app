import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef } from 'react';
import { Platform, StatusBar } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';

const DEFAULT_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type DeviceLocationResult = { granted: true; region: Region } | { granted: false };

async function fetchDeviceLocation(): Promise<DeviceLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    return { granted: false };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    granted: true,
    region: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  };
}

export function SelectLocationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['device-location'],
    queryFn: fetchDeviceLocation,
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.granted) {
      mapRef.current?.animateToRegion(data.region, 500);
    }
  }, [data]);

  const permissionState: 'checking' | 'granted' | 'denied' = !data
    ? 'checking'
    : data.granted
      ? 'granted'
      : 'denied';

  const handleConfirm = () => {
    router.back();
  };

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={permissionState === 'granted'}
        showsMyLocationButton={false}
      />

      {/* ── Centered pin ── */}
      <AppView
        pointerEvents="none"
        style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -14, marginTop: -34 }}
      >
        {Platform.OS === 'ios' ? (
          <SymbolView name="mappin" size={28} tintColor="#FF5A1F" />
        ) : (
          <AppText style={{ fontSize: 28 }}>📍</AppText>
        )}
      </AppView>

      {/* ── Header ── */}
      <AppView
        style={{ paddingTop: insets.top + 8, position: 'absolute', top: 0, left: 0, right: 0 }}
        className="flex-row items-center px-4"
      >
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
      </AppView>

      {/* ── Re-center on current location ── */}
      <AppPressable
        onPress={() => refetch()}
        disabled={isFetching}
        className="absolute right-4 w-11 h-11 rounded-full bg-white dark:bg-neutral-900 items-center justify-center shadow-sm"
        style={{ bottom: insets.bottom + 120 }}
      >
        {Platform.OS === 'ios' ? (
          <SymbolView name="location.fill" size={18} tintColor="#FF5A1F" />
        ) : (
          <AppText style={{ fontSize: 16 }}>📍</AppText>
        )}
      </AppPressable>

      {/* ── Bottom sheet ── */}
      <AppView
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute left-0 right-0 bottom-0 bg-white dark:bg-neutral-900 rounded-t-2xl px-4 pt-4"
      >
        {permissionState === 'denied' ? (
          <AppView className="mb-3">
            <AppText className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Location access is off. Enable it in Settings to use your current location, or drop
              the pin manually.
            </AppText>
          </AppView>
        ) : (
          <AppView className="flex-row items-center mb-3">
            <AppView className="w-3 h-3 rounded-full bg-[#FF5A1F] mr-3" />
            <AppText
              className="flex-1 text-[14px] font-semibold text-neutral-900 dark:text-neutral-100"
              numberOfLines={1}
            >
              Move the map to set your location
            </AppText>
          </AppView>
        )}

        <AppPressable
          onPress={handleConfirm}
          className="py-3.5 rounded-full bg-[#FF5A1F] items-center justify-center mb-2"
        >
          <AppText className="text-[15px] font-bold text-white">Confirm location</AppText>
        </AppPressable>
      </AppView>
    </AppView>
  );
}
