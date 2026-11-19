import { useEffect, useRef, useState } from 'react';

import { useAppSafeAreaInsets, type AppTextInputInstance } from '@/components/ui';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { getErrorMessage } from '@/lib/api/api-error';
import { distanceKm, type GeoPoint } from '@/lib/geo';
import { Alert, Keyboard, useWindowDimensions } from '@/lib/native';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import {
  useSaveAddress,
  useSaveAddressContact,
  useSavedAddresses,
  useUpdateAddress,
} from '@/queries';
import { draftStops, useAuthStore, useTripStore, type TripDraft } from '@/stores';

import type { SaveAsLabel } from '../components/save-as-chips';
import {
  getCurrentPosition,
  getLastKnownPosition,
  peekLastKnownPosition,
  reverseGeocodePlace,
} from '../geocoding';
import { useContactDetailsForm } from './use-contact-details-form';
import { framePath, useMapCamera } from './use-map-camera';
import { usePickerLocation } from './use-picker-location';
import { mapPickerHref, parseMapPickerParams } from '../map-picker-route';
import { alertNotServiceable, isServiceable } from '../serviceability';

const DEFAULT_CENTER: GeoPoint = { latitude: 28.6139, longitude: 77.209 };
export const PINNED_FALLBACK_LABEL = 'Pinned location';

const SAME_POINT_TOLERANCE_KM = 0.02;
const PADDING_SETTLE_MS = 80;
const SAME_PLACE_KM = 0.1;

export type PickerStep = 'pin' | 'details';

function isSamePoint(a: GeoPoint | null, b: GeoPoint): boolean {
  return a !== null && distanceKm(a, b) < SAME_POINT_TOLERANCE_KM;
}

export function toLocalPhone(phone: string | null | undefined): string | undefined {
  return phone?.replace(/\D/g, '').slice(-10);
}

function readSlot(draft: TripDraft, isPickup: boolean, stopIndex: number | undefined) {
  if (stopIndex !== undefined) {
    const stop = draftStops(draft)[stopIndex];
    return {
      label: stop?.label ?? '',
      address: stop?.address ?? '',
      details: stop?.details ?? null,
    };
  }
  return isPickup
    ? { label: draft.pickupLabel, address: draft.pickupAddress, details: draft.pickupDetails }
    : { label: draft.dropLabel, address: draft.dropAddress, details: draft.dropDetails };
}

export function useSelectLocationMap() {
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const screen = useWindowDimensions();
  const picker = parseMapPickerParams(useLocalSearchParams());
  const kind: 'pickup' | 'drop' = picker.mode === 'confirm' ? picker.kind : 'drop';
  const isPickup = kind === 'pickup';
  const stopIndex = picker.mode !== 'edit' ? picker.stopIndex : undefined;

  const draft = useTripStore((s) => s.draft);
  const initialRegion =
    (picker.mode !== 'pin' && picker.region) || (isPickup && draft.dropRegion) || DEFAULT_CENTER;
  const { data: addresses } = useSavedAddresses();
  const savedAddress =
    picker.mode === 'confirm' ? addresses?.find((a) => a.id === picker.addressId) : undefined;
  const updateAddress = useUpdateAddress();
  const saveContact = useSaveAddressContact();
  const saveAddress = useSaveAddress();

  const [saveAs, setSaveAs] = useState<SaveAsLabel | null>(null);
  const [customName, setCustomName] = useState('');
  const takenLabels: SaveAsLabel[] = [
    ...(addresses?.some((a) => a.label === 'home') ? (['home'] as const) : []),
    ...(addresses?.some((a) => a.label === 'work') ? (['shop'] as const) : []),
  ];

  const slot = readSlot(draft, isPickup, stopIndex);
  const currentLabel = slot.label;
  const currentAddress = slot.address;

  const [step, setStep] = useState<PickerStep>(picker.mode === 'pin' ? 'pin' : 'details');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editName, setEditName] = useState(picker.mode === 'edit' ? picker.name : '');
  const [editAddress, setEditAddress] = useState(picker.mode === 'edit' ? picker.address : '');

  const user = useAuthStore((s) => s.user);
  const ownContact = isPickup ? user : null;
  const [houseNumber, setHouseNumber] = useState(
    slot.details?.houseNumber ?? savedAddress?.contact?.houseNumber ?? '',
  );
  const contactForm = useContactDetailsForm(kind, {
    contactName: slot.details?.contactName ?? savedAddress?.contact?.name ?? ownContact?.name,
    contactPhone: toLocalPhone(
      slot.details?.contactPhone ?? savedAddress?.contact?.phone ?? ownContact?.phone,
    ),
  });

  const baseInset = { top: insets.top + 80, bottom: sheetHeight + insets.bottom + 24 };
  const [pinOffset, setPinOffset] = useState({ x: 0, y: 0 });
  const cameraPadding = {
    top: baseInset.top + Math.max(0, 2 * pinOffset.y),
    bottom: baseInset.bottom + Math.max(0, -2 * pinOffset.y),
    left: Math.max(0, 2 * pinOffset.x),
    right: Math.max(0, -2 * pinOffset.x),
  };

  const { cameraRef, center, setCenter, animateTo, handleMapReady, zoom } = useMapCamera(
    initialRegion,
    cameraPadding,
  );
  const committedRegionRef = useRef<GeoPoint | null>(
    picker.mode !== 'pin' ? (picker.region ?? null) : null,
  );

  const location = usePickerLocation({
    picker,
    animateTo,
    onAddressResolved: (point) => {
      committedRegionRef.current = point;
    },
  });

  const [userPoint, setUserPoint] = useState<GeoPoint | null>(peekLastKnownPosition);
  useEffect(() => {
    if (!location.hasPermission) return;
    let cancelled = false;
    getLastKnownPosition().then((point) => {
      if (!cancelled && point) setUserPoint((current) => current ?? point);
    });
    getCurrentPosition().then((point) => {
      if (!cancelled && point) setUserPoint(point);
    });
    return () => {
      cancelled = true;
    };
  }, [location.hasPermission]);

  const [pendingFrame, setPendingFrame] = useState<{
    pin: GeoPoint;
    zoom: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!pendingFrame) return;
    const timer = setTimeout(() => {
      animateTo(pendingFrame.pin, pendingFrame.duration, pendingFrame.zoom);
      setPendingFrame(null);
    }, PADDING_SETTLE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFrame]);

  const frameLine = (pin: GeoPoint, from: GeoPoint | null, duration: number) => {
    const metres = from ? distanceKm(from, pin) * 1000 : 0;
    if (!from || metres <= 15 || metres > 20_000) {
      setPinOffset({ x: 0, y: 0 });
      animateTo(pin, duration);
      return;
    }
    const frame = framePath(pin, from, {
      width: screen.width,
      height: screen.height - baseInset.top - baseInset.bottom,
    });
    setPinOffset(frame.pinOffset);
    setPendingFrame({ pin, zoom: frame.zoom, duration });
  };

  const hasFramedRef = useRef(false);
  const openedAt = picker.mode !== 'pin' ? (picker.region ?? null) : null;
  useEffect(() => {
    if (
      hasFramedRef.current ||
      !openedAt ||
      !userPoint ||
      sheetHeight === 0 ||
      location.hasPermission === null
    ) {
      return;
    }
    hasFramedRef.current = true;
    frameLine(openedAt, userPoint, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedAt?.latitude, openedAt?.longitude, userPoint, sheetHeight, location.hasPermission]);

  const [isMoving, setIsMoving] = useState(false);

  const saveLocation = (region: GeoPoint, place: { label: string; address: string }) => {
    const trip = useTripStore.getState();
    if (stopIndex !== undefined) {
      trip.setStopLocation(stopIndex, place.label, region, place.address);
    } else if (isPickup) {
      trip.setPickup(place.label, region, place.address);
    } else {
      trip.setDrop(place.label, region, place.address);
    }
    committedRegionRef.current = region;
  };

  const stopKind = stopIndex !== undefined ? 'stop' : isPickup ? 'pickup' : 'drop';

  const handleUseCurrentLocation = async () => {
    const position = await location.locateUser();
    if (!position) return;
    setPinOffset({ x: 0, y: 0 });
    animateTo(position, 500);
    if (!isPickup) {
      setUserPoint(position);
      return;
    }
    if (!(await isServiceable(position))) {
      alertNotServiceable(stopKind);
      return;
    }
    saveLocation(position, await reverseGeocodePlace(position, 'Current location'));
    if (user?.name) contactForm.setContactName(user.name);
    if (user?.phone) contactForm.setContactPhone(toLocalPhone(user.phone) ?? '');
  };

  const keyboardHeight = useKeyboardHeight();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isTypingInSheet = keyboardHeight > 0 && !isSearchFocused;

  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const searchInputRef = useRef<AppTextInputInstance>(null);
  const focusSearchAfterCollapseRef = useRef(false);

  const requestSearchFocus = () => {
    focusSearchAfterCollapseRef.current = true;
    setIsSheetCollapsed(true);
  };

  const handleSheetCollapsed = () => {
    if (!focusSearchAfterCollapseRef.current) return;
    focusSearchAfterCollapseRef.current = false;
    searchInputRef.current?.focus();
  };

  const reopenSheet = () => {
    Keyboard.dismiss();
    setIsSheetCollapsed(false);
  };

  const handleSearchSelect = async (point: GeoPoint, place: { label: string; address: string }) => {
    if (!(await isServiceable(point))) {
      alertNotServiceable(stopKind);
      return;
    }
    frameLine(point, userPoint, 500);
    if (step === 'details' && picker.mode !== 'edit') saveLocation(point, place);
  };

  const handleConfirmPin = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    const region = center;
    if (!(await isServiceable(region))) {
      alertNotServiceable(stopKind);
      setIsConfirming(false);
      return;
    }
    saveLocation(region, await reverseGeocodePlace(region, PINNED_FALLBACK_LABEL));
    setIsConfirming(false);
    setStep('details');
  };

  const handleSaveEdit = () => {
    if (picker.mode !== 'edit' || editName.trim().length === 0) return;
    updateAddress.mutate(
      {
        id: picker.addressId,
        name: editName.trim(),
        address: editAddress.trim(),
        location: center,
      },
      {
        onSuccess: () => goBack(router),
        onError: (error) => Alert.alert('Could not save address', getErrorMessage(error)),
      },
    );
  };

  const handleSaveDetails = async () => {
    const details = contactForm.submit();
    if (!details) return;

    const region = center;
    const otherEnd = isPickup ? draft.dropRegion : draft.pickupRegion;
    if (stopIndex === undefined && otherEnd && distanceKm(otherEnd, region) < SAME_PLACE_KM) {
      Alert.alert(
        'Pickup and drop are the same place',
        `Move the pin to where the ${isPickup ? 'parcel is collected' : 'parcel should go'}.`,
      );
      return;
    }
    if (!isSamePoint(committedRegionRef.current, region)) {
      if (!(await isServiceable(region))) {
        alertNotServiceable(stopKind);
        return;
      }
      saveLocation(
        region,
        await reverseGeocodePlace(region, currentLabel || PINNED_FALLBACK_LABEL),
      );
    }

    const trip = useTripStore.getState();
    const stopDetails = { houseNumber: houseNumber.trim(), ...details };
    if (stopIndex !== undefined) trip.setStopDetails(stopIndex, stopDetails);
    else if (isPickup) trip.setPickupDetails(stopDetails);
    else trip.setDropDetails(stopDetails);

    if (savedAddress) {
      saveContact.mutate({
        id: savedAddress.id,
        name: details.contactName,
        phone: details.contactPhone,
        houseNumber: stopDetails.houseNumber,
      });
    } else if (saveAs) {
      const label =
        readSlot(useTripStore.getState().draft, isPickup, stopIndex).label || PINNED_FALLBACK_LABEL;
      saveAddress.mutate({
        name: label,
        address: label,
        location: region,
        label: saveAs,
        customName: saveAs === 'other' ? customName.trim() || undefined : undefined,
        contact: { name: details.contactName, phone: details.contactPhone },
      });
    }

    if (stopIndex !== undefined) {
      router.dismissTo('/add-stops');
    } else if (isPickup && picker.mode === 'confirm' && picker.returnHome) {
      router.dismissTo('/home');
    } else if (isPickup) {
      const now = useTripStore.getState().draft;
      if (now.dropRegion && now.dropDetails) router.replace('/trip-confirmation');
      else goBack(router);
    } else if (!useTripStore.getState().draft.pickupRegion) {
      router.replace(mapPickerHref({ mode: 'confirm', kind: 'pickup' }));
    } else {
      router.replace('/trip-confirmation');
    }
  };

  return {
    insets,
    picker,
    kind,
    isPickup,
    stopIndex,
    initialRegion,
    zoom,
    center,
    setCenter,
    cameraRef,
    handleMapReady,
    cameraPadding,
    pinOffset,
    userPoint,
    location,
    step,
    sheetHeight,
    setSheetHeight,
    isConfirming,
    isMoving,
    setIsMoving,
    currentLabel,
    currentAddress,
    editName,
    setEditName,
    editAddress,
    setEditAddress,
    houseNumber,
    setHouseNumber,
    contactForm,
    user,
    savedAddress,
    saveAs,
    setSaveAs,
    customName,
    setCustomName,
    takenLabels,
    keyboardHeight,
    isSearchFocused,
    setIsSearchFocused,
    isTypingInSheet,
    isSheetCollapsed,
    setIsSheetCollapsed,
    searchInputRef,
    requestSearchFocus,
    handleSheetCollapsed,
    reopenSheet,
    handleUseCurrentLocation,
    handleSearchSelect,
    handleConfirmPin,
    handleSaveEdit,
    handleSaveDetails,
    goBack: () => goBack(router),
  };
}
