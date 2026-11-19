import { useEffect, useRef, useState } from 'react';

import { distanceKm, type GeoPoint } from '@/lib/geo';
import { useWindowDimensions } from '@/lib/native';

import {
  getCurrentPosition,
  getLastKnownPosition,
  peekLastKnownPosition,
  reverseGeocodePlace,
} from '../geocoding';
import type { MapPickerMode } from '../map-picker-route';
import { alertNotServiceable, isServiceable } from '../serviceability';
import { framePath, useMapCamera } from './use-map-camera';
import { usePickerLocation } from './use-picker-location';
import type { PickerStep } from './use-select-location-map';

const DEFAULT_CENTER: GeoPoint = { latitude: 28.6139, longitude: 77.209 };
const PADDING_SETTLE_MS = 80;

interface UseMapPinFramingOptions {
  picker: MapPickerMode;
  isPickup: boolean;
  stopKind: 'pickup' | 'drop' | 'stop';
  dropRegion: GeoPoint | null;
  step: PickerStep;
  sheetHeight: number;
  topInset: number;
  bottomInset: number;
  onAddressResolved: (point: GeoPoint) => void;
  onSaveLocation: (region: GeoPoint, place: { label: string; address: string }) => void;
  onPickupLocated?: () => void;
}

export function useMapPinFraming({
  picker,
  isPickup,
  stopKind,
  dropRegion,
  step,
  sheetHeight,
  topInset,
  bottomInset,
  onAddressResolved,
  onSaveLocation,
  onPickupLocated,
}: UseMapPinFramingOptions) {
  const screen = useWindowDimensions();
  const initialRegion =
    (picker.mode !== 'pin' && picker.region) || (isPickup && dropRegion) || DEFAULT_CENTER;

  const baseInset = { top: topInset + 80, bottom: sheetHeight + bottomInset + 24 };
  const [pinOffset, setPinOffset] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

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

  const location = usePickerLocation({ picker, animateTo, onAddressResolved });
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

  const animateToRef = useRef(animateTo);
  useEffect(() => {
    animateToRef.current = animateTo;
  });

  useEffect(() => {
    if (!pendingFrame) return;
    const timer = setTimeout(() => {
      animateToRef.current(pendingFrame.pin, pendingFrame.duration, pendingFrame.zoom);
      setPendingFrame(null);
    }, PADDING_SETTLE_MS);
    return () => clearTimeout(timer);
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

  const frameLineRef = useRef(frameLine);
  useEffect(() => {
    frameLineRef.current = frameLine;
  });

  const hasFramedRef = useRef(false);
  const openedAt = picker.mode !== 'pin' ? (picker.region ?? null) : null;
  const openedAtLat = openedAt?.latitude;
  const openedAtLng = openedAt?.longitude;

  useEffect(() => {
    if (
      hasFramedRef.current ||
      openedAtLat === undefined ||
      openedAtLng === undefined ||
      !userPoint ||
      sheetHeight === 0 ||
      location.hasPermission === null
    ) {
      return;
    }
    hasFramedRef.current = true;
    frameLineRef.current({ latitude: openedAtLat, longitude: openedAtLng }, userPoint, 500);
  }, [openedAtLat, openedAtLng, userPoint, sheetHeight, location.hasPermission]);

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
    onSaveLocation(position, await reverseGeocodePlace(position, 'Current location'));
    onPickupLocated?.();
  };

  const handleSearchSelect = async (point: GeoPoint, place: { label: string; address: string }) => {
    if (!(await isServiceable(point))) {
      alertNotServiceable(stopKind);
      return;
    }
    frameLine(point, userPoint, 500);
    if (step === 'details' && picker.mode !== 'edit') onSaveLocation(point, place);
  };

  return {
    initialRegion,
    zoom,
    center,
    setCenter,
    isMoving,
    setIsMoving,
    pinOffset,
    cameraPadding,
    userPoint,
    frameLine,
    cameraRef,
    handleMapReady,
    location,
    handleSearchSelect,
    handleUseCurrentLocation,
  };
}
