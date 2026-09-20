import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  type OlaMapCameraRef,
  OlaMapUserLocation,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { useTripStore } from '@/stores/trip-store';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: Coordinate = {
  latitude: 28.6139,
  longitude: 77.209,
};

const BOTTOM_SHEET_CONTENT_HEIGHT = 110;

type PermissionStatus = 'checking' | 'granted' | 'denied';

// Ola Maps is configured in the OlaMapView shared component

export function SelectLocationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<OlaMapCameraRef>(null);

  const [currentRegion, setCurrentRegion] = useState<Coordinate>(DEFAULT_CENTER);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isMapReadyRef = useRef(false);
  const pendingCoordsRef = useRef<Coordinate | null>(null);

  // ── Helper to smoothly animate the map ─────────────────────────────────────
  const animateTo = (latitude: number, longitude: number, duration = 600) => {
    setCurrentRegion({ latitude, longitude });

    if (isMapReadyRef.current && cameraRef.current) {
      cameraRef.current.easeTo({ center: [longitude, latitude], zoom: 16, duration });
    } else {
      // Map isn't ready yet — save coordinates to animate as soon as onMapReady fires
      pendingCoordsRef.current = { latitude, longitude };
    }
  };

  // ── Core Location Fetching Logic ───────────────────────────────────────────
  const fetchAndAnimateLocation = async (isManualPress = false) => {
    if (isManualPress) {
      setIsFetchingLocation(true);
    }

    try {
      // 1. Verify device location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (isManualPress) {
          Alert.alert(
            'Location Services Disabled',
            'Please turn on Location Services in your device Settings to find your current location.',
            [{ text: 'OK' }],
          );
        }
        return;
      }

      // 2. Verify/request foreground permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        setPermissionStatus('denied');
        if (isManualPress) {
          Alert.alert(
            'Location Permission Needed',
            'Logistics App needs location access to pinpoint your pickup or drop location.',
            [{ text: 'OK' }],
          );
        }
        return;
      }

      setPermissionStatus('granted');

      // 3. Instant path: cached last-known position (<50ms)
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          animateTo(lastKnown.coords.latitude, lastKnown.coords.longitude, 400);
        }
      } catch {
        // ignore and continue
      }

      // 4. Accurate fix: try getCurrentPositionAsync
      let gotLocation = false;
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (current?.coords) {
          gotLocation = true;
          animateTo(current.coords.latitude, current.coords.longitude, 600);
        }
      } catch {
        // iOS CoreLocation threw kCLErrorDomain error 0 (LocationUnavailable)
        // This is a temporary error while CoreLocation acquires fix.
        // Fall back to watchPositionAsync which streams until first valid coordinate!
      }

      // 5. Resilient Fallback: watchPositionAsync (safely handles kCLErrorDomain error 0)
      if (!gotLocation) {
        await new Promise<void>((resolve) => {
          let sub: Location.LocationSubscription | null = null;
          const timer = setTimeout(() => {
            sub?.remove();
            resolve();
          }, 6000);

          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 1,
            },
            (loc) => {
              clearTimeout(timer);
              sub?.remove();
              if (loc?.coords) {
                animateTo(loc.coords.latitude, loc.coords.longitude, 500);
              }
              resolve();
            },
          )
            .then((s) => {
              sub = s;
            })
            .catch(() => {
              clearTimeout(timer);
              resolve();
            });
        });
      }
    } catch (error) {
      console.warn('[Location] Failed to retrieve device coordinates:', error);
      if (isManualPress) {
        Alert.alert(
          'Location Notice',
          'Unable to acquire current location. Please pan the map manually.',
        );
      }
    } finally {
      if (isManualPress) {
        setIsFetchingLocation(false);
      }
    }
  };

  // ── Auto-fetch current location on screen mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        await fetchAndAnimateLocation(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── When the map style has finished loading ────────────────────────────────
  const handleMapReady = () => {
    isMapReadyRef.current = true;
    if (pendingCoordsRef.current) {
      const { latitude, longitude } = pendingCoordsRef.current;
      pendingCoordsRef.current = null;
      cameraRef.current?.easeTo({ center: [longitude, latitude], zoom: 16, duration: 500 });
    }
  };

  // ── Recenter button press handler ──────────────────────────────────────────
  const handleRecenter = async () => {
    if (isFetchingLocation) return;
    await fetchAndAnimateLocation(true);
  };

  // ── Confirm pin location ───────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);

    try {
      const [place] = await Location.reverseGeocodeAsync(currentRegion);
      const label = place
        ? [place.name, place.street, place.city].filter(Boolean).slice(0, 2).join(', ')
        : '';

      useTripStore.getState().setDropRegionLabel(currentRegion, label || 'Pinned location');
    } catch {
      useTripStore.getState().setDropRegionLabel(currentRegion, 'Pinned location');
    } finally {
      setIsConfirming(false);
      router.back();
    }
  };

  const bottomSheetHeight = BOTTOM_SHEET_CONTENT_HEIGHT + insets.bottom + 16;

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Ola Maps ── */}
      <OlaMapView
        style={StyleSheet.absoluteFill}
        compass={false}
        onDidFinishLoadingMap={handleMapReady}
        onRegionDidChange={(event) => {
          const [longitude, latitude] = event.nativeEvent.center;
          setCurrentRegion({ latitude, longitude });
        }}
      >
        <OlaMapCamera
          ref={cameraRef}
          initialViewState={{
            center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
            zoom: 16,
          }}
        />
        {permissionStatus === 'granted' && <OlaMapUserLocation />}
      </OlaMapView>

      {/* ── High-Visibility Professional Delivery Marker Pin ── */}
      <AppView pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AppView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Shift pin upwards so the tip touches the exact map center */}
          <AppView style={{ alignItems: 'center', marginTop: -54 }}>
            {/* Tooltip Pill */}
            <AppView className="bg-neutral-900/90 dark:bg-black/90 px-3 py-1 rounded-full shadow-md mb-1.5 border border-white/20">
              <AppText className="text-[11px] font-bold text-white tracking-wide">
                Pin Location
              </AppText>
            </AppView>

            {/* Pin Head */}
            <AppView
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FF5A1F',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 8,
              }}
            >
              {Platform.OS === 'ios' ? (
                <SymbolView name="mappin" size={22} tintColor="#FFFFFF" />
              ) : (
                <AppText style={{ fontSize: 20 }}>📍</AppText>
              )}
            </AppView>

            {/* Pin Stem */}
            <AppView
              style={{
                width: 4,
                height: 10,
                backgroundColor: '#FF5A1F',
                borderRadius: 2,
                marginTop: -2,
              }}
            />

            {/* Ground shadow target dot */}
            <AppView
              style={{
                width: 10,
                height: 5,
                borderRadius: 5,
                backgroundColor: '#0F172A',
                opacity: 0.45,
                marginTop: 1,
              }}
            />
          </AppView>
        </AppView>
      </AppView>

      {/* ── Header / Back Button ── */}
      <AppView
        style={{
          paddingTop: insets.top + 8,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
        className="flex-row items-center px-4"
      >
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
      </AppView>

      {/* ── High-Visibility Current Location (Recenter) Button ── */}
      <AppPressable
        onPress={handleRecenter}
        disabled={isFetchingLocation}
        style={{
          position: 'absolute',
          right: 16,
          bottom: bottomSheetHeight + 16,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 10,
          zIndex: 999,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.06)',
          opacity: isFetchingLocation ? 0.7 : 1,
        }}
      >
        {isFetchingLocation ? (
          <ActivityIndicator size="small" color="#FF5A1F" />
        ) : Platform.OS === 'ios' ? (
          <SymbolView name="location.fill" size={24} tintColor="#FF5A1F" />
        ) : (
          <AppText style={{ fontSize: 22 }}>📍</AppText>
        )}
      </AppPressable>

      {/* ── Bottom Sheet ── */}
      <AppView
        style={{ paddingBottom: insets.bottom + 16, zIndex: 100 }}
        className="absolute left-0 right-0 bottom-0 bg-white dark:bg-neutral-900 rounded-t-2xl px-4 pt-4 shadow-lg"
      >
        {permissionStatus === 'denied' ? (
          <AppView className="mb-3 flex-row items-center">
            <AppView className="w-3 h-3 rounded-full bg-neutral-400 mr-3" />
            <AppText className="flex-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
              Location access is off. Tap the target button to grant permission, or drag the map
              manually.
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
          disabled={isConfirming}
          className="py-3.5 rounded-full bg-[#FF5A1F] items-center justify-center mb-2 disabled:opacity-60"
        >
          <AppText className="text-[15px] font-bold text-white">
            {isConfirming ? 'Locating address…' : 'Confirm location'}
          </AppText>
        </AppPressable>
      </AppView>
    </AppView>
  );
}
