import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppKeyboardAvoidingView } from '@/components/ui/app-keyboard-avoiding-view';
import { AppPressable } from '@/components/ui/app-pressable';
import { AppScrollView } from '@/components/ui/app-scroll-view';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { Icon } from '@/components/ui/icon';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  type OlaMapCameraRef,
  OlaMapUserLocation,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { cn } from '@/lib/cn';
import { useTripStore } from '@/stores/trip-store';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: Coordinate = {
  latitude: 28.6139,
  longitude: 77.209,
};

const AnimatedAppView = Animated.createAnimatedComponent(AppView);

type PermissionStatus = 'checking' | 'granted' | 'denied';
type ConfirmStep = 'pin' | 'details';

// Ola Maps is configured in the OlaMapView shared component

// ─── Delivery pin graphic ────────────────────────────────────────────────────
// Shared between the fixed drag-crosshair (pin step) and the real
// map-anchored marker (details step) so both look identical.

function DeliveryPinGraphic() {
  return (
    <AppView style={{ alignItems: 'center' }}>
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
        <Icon name="mappin" size={22} color="#FFFFFF" />
      </AppView>

      <AppView
        style={{
          width: 4,
          height: 10,
          backgroundColor: '#FF5A1F',
          borderRadius: 2,
          marginTop: -2,
        }}
      />

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
  );
}

// ─── Labeled field ──────────────────────────────────────────────────────────

interface LabeledFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  maxLength?: number;
  error?: string;
}

function LabeledField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  error,
}: LabeledFieldProps) {
  return (
    <AppView className="mb-3">
      <AppText className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        maxLength={maxLength}
        className={cn(
          'bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-[14px] font-medium text-neutral-900 dark:text-neutral-100 border',
          error ? 'border-red-500' : 'border-transparent',
        )}
      />
      {error ? (
        <AppText className="text-[11px] font-medium text-red-500 mt-1">{error}</AppText>
      ) : null}
    </AppView>
  );
}

export function SelectLocationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target, addressKind, editId, editName, editAddress, addressId, lat, lng } =
    useLocalSearchParams<{
      target?: string;
      addressKind?: string;
      editId?: string;
      editName?: string;
      editAddress?: string;
      addressId?: string;
      lat?: string;
      lng?: string;
    }>();
  // Pickup only ever reaches this screen by confirming a search result
  // (`target=confirm`, `addressKind=pickup`) — it has no pin-drag entry.
  const isPickupMode = addressKind === 'pickup';
  const isEditMode = target === 'edit' && Boolean(editId);
  // A location tapped from search/recents — center the map on it and go
  // straight to the details step (contact info), not editing a saved place.
  const isConfirmMode = target === 'confirm';
  const skipsPinStep = isEditMode || isConfirmMode;
  const { height: screenHeight } = useWindowDimensions();
  const cameraRef = useRef<OlaMapCameraRef>(null);

  const targetRegionParam: Coordinate | null =
    lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : null;

  const [currentRegion, setCurrentRegion] = useState<Coordinate>(
    targetRegionParam ?? DEFAULT_CENTER,
  );
  // The map is always draggable with the pin fixed at screen center (the
  // crosshair pattern) — this tracks the last coordinate that was actually
  // committed to the store, so `handleSaveDetails` can tell whether the user
  // dragged to a new spot since arriving (and only then re-geocode/re-save
  // the location), instead of always overwriting a nicer search-result label.
  const committedRegionRef = useRef<Coordinate | null>(targetRegionParam);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [step, setStep] = useState<ConfirmStep>(skipsPinStep ? 'details' : 'pin');

  // Pre-fill from this address's last-used contact info, if it has one
  // (e.g. re-searching the same place — see `handleSaveDetails` below for
  // where this gets saved).
  const savedAddresses = useTripStore.use.addresses();
  const matchedAddress = addressId ? savedAddresses.find((a) => a.id === addressId) : undefined;

  const [houseNumber, setHouseNumber] = useState(matchedAddress?.houseNumber ?? '');
  const [contactName, setContactName] = useState(matchedAddress?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(matchedAddress?.contactPhone ?? '');
  const [showDetailsErrors, setShowDetailsErrors] = useState(false);

  const contactLabel = isPickupMode ? "Sender's" : "Receiver's";
  const contactNameError =
    showDetailsErrors && contactName.trim().length === 0
      ? `${contactLabel} name is required`
      : undefined;
  const contactPhoneError = !showDetailsErrors
    ? undefined
    : contactPhone.trim().length === 0
      ? `${contactLabel} phone number is required`
      : contactPhone.trim().length !== 10
        ? 'Enter a valid 10-digit phone number'
        : undefined;

  const [editLabel, setEditLabel] = useState(editName ?? '');
  const [editAddressText, setEditAddressText] = useState(editAddress ?? '');

  const isMapReadyRef = useRef(false);
  const pendingCoordsRef = useRef<Coordinate | null>(null);

  // ── Drag-to-dismiss for the bottom sheet ────────────────────────────────────
  const sheetTranslateY = useSharedValue(0);
  const dismissSheet = () => router.back();
  const dragGesture = Gesture.Pan()
    .onChange((event) => {
      sheetTranslateY.value = Math.max(0, sheetTranslateY.value + event.changeY);
    })
    .onEnd((event) => {
      const shouldDismiss = sheetTranslateY.value > 120 || event.velocityY > 800;
      if (shouldDismiss) {
        sheetTranslateY.value = withTiming(screenHeight, { duration: 200 }, (finished) => {
          if (finished) runOnJS(dismissSheet)();
        });
      } else {
        sheetTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // Reset any leftover drag offset whenever the sheet's content changes step
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- reanimated shared value mutation
    sheetTranslateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // The bottom sheet covers part of the screen, so the visible map area is
  // smaller than the full screen — pad the camera so a centered coordinate
  // actually lands in the middle of what's still visible above the sheet,
  // not the middle of the whole (partly-covered) screen.
  const cameraPadding = {
    top: insets.top + 80,
    bottom: sheetHeight + insets.bottom + 24,
  };

  // ── Helper to smoothly animate the map ─────────────────────────────────────
  const animateTo = (latitude: number, longitude: number, duration = 600) => {
    setCurrentRegion({ latitude, longitude });

    if (isMapReadyRef.current && cameraRef.current) {
      cameraRef.current.easeTo({
        center: [longitude, latitude],
        zoom: 16,
        duration,
        padding: cameraPadding,
      });
    } else {
      // Map isn't ready yet — save coordinates to animate as soon as onMapReady fires
      pendingCoordsRef.current = { latitude, longitude };
    }
  };

  // ── Core Location Fetching Logic ───────────────────────────────────────────
  // Only ever called quietly on mount (pin step is drop-only now, and drop
  // doesn't need a manual "recenter to me" action) — no user-facing alerts.
  const fetchAndAnimateLocation = async () => {
    try {
      // 1. Verify device location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
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
    }
  };

  // ── On mount: edit/confirm mode centers on the given location, otherwise
  // auto-fetch the device's current location ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;

      if (skipsPinStep) {
        // Just check (don't request) so the device's blue-dot location
        // marker still shows here if permission was already granted
        // earlier — this flow doesn't otherwise touch location permission.
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (!cancelled && status === 'granted') {
            setPermissionStatus('granted');
          }
        } catch {
          // leave permissionStatus as-is
        }

        if (targetRegionParam) {
          animateTo(targetRegionParam.latitude, targetRegionParam.longitude, 400);
          return;
        }
        if (isEditMode && editAddress) {
          try {
            const [geocoded] = await Location.geocodeAsync(editAddress);
            if (!cancelled && geocoded) {
              const resolved = { latitude: geocoded.latitude, longitude: geocoded.longitude };
              committedRegionRef.current = resolved;
              animateTo(resolved.latitude, resolved.longitude, 400);
            }
          } catch {
            // fall back to DEFAULT_CENTER, already the initial region
          }
        }
        return;
      }

      await fetchAndAnimateLocation();
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
      cameraRef.current?.easeTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 500,
        padding: cameraPadding,
      });
    }
  };

  // ── "Use current location" — pickup only, shown in the details step since
  // that's the only step pickup reaches ────────────────────────────────────
  const handleUseCurrentLocation = async () => {
    if (isLocatingCurrent) return;
    setIsLocatingCurrent(true);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please turn on Location Services in your device Settings to use your current location.',
        );
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        setPermissionStatus('denied');
        Alert.alert(
          'Location Permission Needed',
          'Logistics App needs location access to use your current location.',
        );
        return;
      }

      setPermissionStatus('granted');

      const position =
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(
          () => null,
        )) ?? (await Location.getLastKnownPositionAsync().catch(() => null));

      if (!position?.coords) {
        Alert.alert('Location Notice', 'Unable to acquire current location.');
        return;
      }

      const region = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      committedRegionRef.current = region;
      animateTo(region.latitude, region.longitude, 500);

      const [place] = await Location.reverseGeocodeAsync(region).catch(() => []);
      const label = place
        ? [place.name, place.street, place.city].filter(Boolean).slice(0, 2).join(', ')
        : '';
      useTripStore.getState().setPickupLocation(region, label || 'Current location');
    } catch (error) {
      console.warn('[Location] Failed to use current location:', error);
      Alert.alert('Location Notice', 'Unable to acquire current location.');
    } finally {
      setIsLocatingCurrent(false);
    }
  };

  // ── Step 1: reverse-geocode the pin, then always expand into the
  // address-details step (pickup asks for sender info, drop for receiver) ──
  const handleConfirmPin = async () => {
    if (isConfirming) return;
    setIsConfirming(true);

    try {
      const [place] = await Location.reverseGeocodeAsync(currentRegion);
      const label = place
        ? [place.name, place.street, place.city].filter(Boolean).slice(0, 2).join(', ')
        : '';
      const resolvedLabel = label || 'Pinned location';

      if (isPickupMode) {
        useTripStore.getState().setPickupLocation(currentRegion, resolvedLabel);
      } else {
        useTripStore.getState().setDropRegionLabel(currentRegion, resolvedLabel);
      }
    } catch {
      if (isPickupMode) {
        useTripStore.getState().setPickupLocation(currentRegion, 'Pinned location');
      } else {
        useTripStore.getState().setDropRegionLabel(currentRegion, 'Pinned location');
      }
    } finally {
      committedRegionRef.current = currentRegion;
      setIsConfirming(false);
      setStep('details');
    }
  };

  // ── Step 2: save the contact details and return to the calling screen ─────
  const handleSaveDetails = async () => {
    if (isEditMode && editId) {
      const trimmedLabel = editLabel.trim();
      if (trimmedLabel.length === 0) return;
      useTripStore.getState().updateAddress(editId, {
        name: trimmedLabel,
        address: editAddressText.trim(),
        region: currentRegion,
      });
      router.back();
      return;
    }

    const trimmedContactName = contactName.trim();
    const trimmedContactPhone = contactPhone.trim();
    if (trimmedContactName.length === 0 || trimmedContactPhone.length !== 10) {
      setShowDetailsErrors(true);
      return;
    }

    const trimmedHouseNumber = houseNumber.trim();

    // The map stays draggable the whole time — if the user moved the pin
    // since arriving, re-geocode and re-save the location so it matches
    // where the pin actually ended up. If they never touched it, leave the
    // original label (e.g. the nicer search-result name) alone.
    const committed = committedRegionRef.current;
    const wasMoved =
      !committed ||
      committed.latitude !== currentRegion.latitude ||
      committed.longitude !== currentRegion.longitude;

    if (wasMoved) {
      let resolvedLabel = currentLabel || 'Pinned location';
      try {
        const [place] = await Location.reverseGeocodeAsync(currentRegion);
        if (place) {
          resolvedLabel =
            [place.name, place.street, place.city].filter(Boolean).slice(0, 2).join(', ') ||
            resolvedLabel;
        }
      } catch {
        // keep the previous label
      }

      if (isPickupMode) {
        useTripStore.getState().setPickupLocation(currentRegion, resolvedLabel);
      } else {
        useTripStore.getState().setDropRegionLabel(currentRegion, resolvedLabel);
      }
      committedRegionRef.current = currentRegion;
    }

    if (isPickupMode) {
      useTripStore.getState().setPickupAddressDetails({
        houseNumber: trimmedHouseNumber,
        senderName: trimmedContactName,
        senderPhone: trimmedContactPhone,
      });
    } else {
      useTripStore.getState().setDropAddressDetails({
        houseNumber: trimmedHouseNumber,
        receiverName: trimmedContactName,
        receiverPhone: trimmedContactPhone,
      });
    }

    // Remember this contact info on the saved address itself, so picking
    // the same place again pre-fills it instead of starting blank.
    if (addressId) {
      useTripStore.getState().setSavedAddressContact(addressId, {
        houseNumber: trimmedHouseNumber,
        contactName: trimmedContactName,
        contactPhone: trimmedContactPhone,
      });
    }

    // Saving here already confirms the address — go straight to the next
    // step instead of bouncing back for a second, redundant confirm tap.
    // `replace` so the map screen isn't left stale in the back stack.
    router.replace(isPickupMode ? '/location-select' : '/trip-confirmation');
  };

  const draft = useTripStore.use.draft();
  const currentLabel = isPickupMode ? draft.pickupLabel : draft.dropLabel;

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Ola Maps — always draggable, pin fixed at screen center ── */}
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
            center: [
              (targetRegionParam ?? DEFAULT_CENTER).longitude,
              (targetRegionParam ?? DEFAULT_CENTER).latitude,
            ],
            zoom: 16,
            padding: cameraPadding,
          }}
        />
        {permissionStatus === 'granted' && <OlaMapUserLocation />}
      </OlaMapView>

      {/* ── Delivery pin — fixed at the center of the visible map area; the
          map moves underneath it, so the user pins a location by dragging
          the map. Centered the same way the camera frames the map itself
          (`cameraPadding`), not the full screen — otherwise the pin sits
          lower than the header-to-sheet area it's actually supposed to
          mark the middle of. ── */}
      <AppView pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AppView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: cameraPadding.top,
            paddingBottom: cameraPadding.bottom,
          }}
        >
          {/* Shift pin upwards so the tip touches the exact map center */}
          <AppView style={{ alignItems: 'center', marginTop: -54 }}>
            {step === 'pin' && (
              <AppView className="bg-neutral-900/90 dark:bg-black/90 px-3 py-1 rounded-full shadow-md mb-1.5 border border-white/20">
                <AppText className="text-[11px] font-bold text-white tracking-wide">
                  Pin Location
                </AppText>
              </AppView>
            )}
            <DeliveryPinGraphic />
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

      {/* ── "Use current location" — pickup only ── */}
      {isPickupMode ? (
        <AppPressable
          onPress={handleUseCurrentLocation}
          disabled={isLocatingCurrent}
          style={{
            position: 'absolute',
            right: 16,
            bottom: sheetHeight + 16,
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
            opacity: isLocatingCurrent ? 0.7 : 1,
          }}
        >
          {isLocatingCurrent ? (
            <ActivityIndicator size="small" color="#FF5A1F" />
          ) : (
            <Icon name="scope" size={24} color="#FF5A1F" />
          )}
        </AppPressable>
      ) : null}

      {/* ── Bottom panel: pin confirmation, then expands in place for details ── */}
      <AppKeyboardAvoidingView
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        className="bg-transparent"
        pointerEvents="box-none"
      >
        <AnimatedAppView
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={[{ zIndex: 100 }, sheetAnimatedStyle]}
          className="bg-white dark:bg-neutral-900 rounded-t-2xl shadow-lg overflow-hidden"
        >
          {/* Drag handle — the only region that grabs the drag-to-dismiss gesture,
              so it never fights the form's ScrollView or TextInputs for touches. */}
          <GestureDetector gesture={dragGesture}>
            <AppView className="items-center pt-2 pb-2">
              <AppView className="w-9 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </AppView>
          </GestureDetector>

          {step === 'pin' ? (
            <AppView style={{ paddingBottom: insets.bottom + 16 }} className="px-4 pt-2">
              {permissionStatus === 'denied' ? (
                <AppView className="mb-3 flex-row items-center">
                  <AppView className="w-3 h-3 rounded-full bg-neutral-400 mr-3" />
                  <AppText className="flex-1 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                    Drag the map to choose the {isPickupMode ? 'pickup' : 'drop'} location.
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
                onPress={handleConfirmPin}
                disabled={isConfirming}
                className="py-3.5 rounded-full bg-[#FF5A1F] items-center justify-center disabled:opacity-60"
              >
                <AppText className="text-[15px] font-bold text-white">
                  {isConfirming ? 'Locating address…' : 'Confirm location'}
                </AppText>
              </AppPressable>
            </AppView>
          ) : (
            <>
              <AppScrollView
                style={{ maxHeight: screenHeight * 0.6 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingTop: 8 }}
              >
                {isEditMode ? (
                  <>
                    <AppText className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                      Edit location
                    </AppText>

                    <LabeledField
                      label="Label"
                      value={editLabel}
                      onChangeText={setEditLabel}
                      placeholder="e.g. Home, Work"
                    />
                    <LabeledField
                      label="Address"
                      value={editAddressText}
                      onChangeText={setEditAddressText}
                      placeholder="Full address"
                    />
                  </>
                ) : (
                  <>
                    <AppText className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {isPickupMode ? 'Add pickup details' : 'Add drop details'}
                    </AppText>
                    <AppText
                      className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4"
                      numberOfLines={2}
                    >
                      {currentLabel || 'Pinned location'}
                    </AppText>

                    <LabeledField
                      label={`${contactLabel} name`}
                      value={contactName}
                      onChangeText={setContactName}
                      placeholder="Who should we contact?"
                      error={contactNameError}
                    />
                    <LabeledField
                      label={`${contactLabel} phone number`}
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      placeholder="10-digit mobile number"
                      keyboardType="phone-pad"
                      maxLength={10}
                      error={contactPhoneError}
                    />
                    <LabeledField
                      label="House / Flat / Block No. (optional)"
                      value={houseNumber}
                      onChangeText={setHouseNumber}
                      placeholder="e.g. A-42, 3rd Floor"
                    />
                  </>
                )}
              </AppScrollView>

              <AppView style={{ paddingBottom: insets.bottom + 16 }} className="px-4">
                <AppPressable
                  onPress={handleSaveDetails}
                  className="py-3.5 rounded-full bg-[#FF5A1F] items-center justify-center"
                >
                  <AppText className="text-[15px] font-bold text-white">
                    {isEditMode ? 'Save changes' : 'Save address'}
                  </AppText>
                </AppPressable>
              </AppView>
            </>
          )}
        </AnimatedAppView>
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
