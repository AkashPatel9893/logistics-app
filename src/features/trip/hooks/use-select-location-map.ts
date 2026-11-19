import { useRef, useState } from 'react';

import { useAppSafeAreaInsets } from '@/components/ui';
import { distanceKm, type GeoPoint } from '@/lib/geo';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { draftStops, useTripStore, type StopDetails, type TripDraft } from '@/stores';

import { reverseGeocodePlace } from '../geocoding';
import { parseMapPickerParams } from '../map-picker-route';
import { alertNotServiceable, isServiceable } from '../serviceability';

export const PINNED_FALLBACK_LABEL = 'Pinned location';

const SAME_POINT_TOLERANCE_KM = 0.02;

export type PickerStep = 'pin' | 'details';

export interface SlotState {
  label: string;
  address: string;
  details: StopDetails | null;
}

export function toLocalPhone(phone: string | null | undefined): string | undefined {
  return phone?.replace(/\D/g, '').slice(-10);
}

export function readSlot(
  draft: TripDraft,
  isPickup: boolean,
  stopIndex: number | undefined,
): SlotState {
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
  const picker = parseMapPickerParams(useLocalSearchParams());
  const kind: 'pickup' | 'drop' = picker.mode === 'confirm' ? picker.kind : 'drop';
  const isPickup = kind === 'pickup';
  const stopIndex = picker.mode !== 'edit' ? picker.stopIndex : undefined;
  const stopKind: 'pickup' | 'drop' | 'stop' =
    stopIndex !== undefined ? 'stop' : isPickup ? 'pickup' : 'drop';

  const draft = useTripStore((s) => s.draft);
  const slot = readSlot(draft, isPickup, stopIndex);

  const [step, setStep] = useState<PickerStep>(picker.mode === 'pin' ? 'pin' : 'details');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);

  const committedRegionRef = useRef<GeoPoint | null>(
    picker.mode !== 'pin' ? (picker.region ?? null) : null,
  );

  const isRegionCommitted = (region: GeoPoint) =>
    committedRegionRef.current !== null &&
    distanceKm(committedRegionRef.current, region) < SAME_POINT_TOLERANCE_KM;

  const markRegionCommitted = (region: GeoPoint) => {
    committedRegionRef.current = region;
  };

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

  const confirmPin = async (region: GeoPoint) => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      if (!(await isServiceable(region))) {
        alertNotServiceable(stopKind);
        return;
      }
      saveLocation(region, await reverseGeocodePlace(region, PINNED_FALLBACK_LABEL));
      setStep('details');
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    insets,
    picker,
    kind,
    isPickup,
    stopIndex,
    stopKind,
    draft,
    slot,
    step,
    sheetHeight,
    setSheetHeight,
    isConfirming,
    isRegionCommitted,
    markRegionCommitted,
    saveLocation,
    confirmPin,
    goBack: () => goBack(router),
  };
}
