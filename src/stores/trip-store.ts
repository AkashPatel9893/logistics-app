import { create } from 'zustand';

import type { GeoPoint } from '@/lib/api/models';
import { createSelectors } from '@/lib/create-selectors';
import { kvStorage } from '@/lib/storage';

/**
 * The booking being built across screens (addresses → vehicle → checkout).
 * Pure client state: nothing here is sent to the server until the order is
 * created. Saved addresses live in the query cache, not here.
 */

const TRIP_STORAGE_KEY = 'trip_draft_v2';

export type PickedRegion = GeoPoint;

export interface StopDetails {
  houseNumber: string;
  contactName: string;
  contactPhone: string;
}

export interface TripDraft {
  pickupLabel: string;
  pickupRegion: PickedRegion | null;
  pickupDetails: StopDetails | null;
  dropLabel: string;
  dropRegion: PickedRegion | null;
  dropDetails: StopDetails | null;
  selectedVehicleId: string | null;
  couponCode: string | null;
}

// Hans Bhawan Wing-1, IP Estate, New Delhi — the demo's default pickup.
const DEFAULT_DRAFT: TripDraft = {
  pickupLabel: 'Hans Bhawan Wing-1, IP Estate, New Delhi',
  pickupRegion: { latitude: 28.628, longitude: 77.2405 },
  pickupDetails: null,
  dropLabel: '',
  dropRegion: null,
  dropDetails: null,
  selectedVehicleId: null,
  couponCode: null,
};

function loadDraft(): TripDraft {
  const raw = kvStorage.getString(TRIP_STORAGE_KEY);
  if (!raw) return DEFAULT_DRAFT;
  try {
    return { ...DEFAULT_DRAFT, ...(JSON.parse(raw) as Partial<TripDraft>) };
  } catch {
    return DEFAULT_DRAFT;
  }
}

type TripState = {
  draft: TripDraft;
  setPickup: (label: string, region: PickedRegion | null) => void;
  setDrop: (label: string, region: PickedRegion | null) => void;
  setPickupDetails: (details: StopDetails) => void;
  setDropDetails: (details: StopDetails) => void;
  setSelectedVehicle: (vehicleId: string) => void;
  setCouponCode: (code: string | null) => void;
  /** Starts a new booking, keeping the last pickup. */
  resetDraft: () => void;
  reset: () => void;
};

const _useTripStore = create<TripState>((set, get) => {
  const update = (patch: Partial<TripDraft>) => {
    const draft = { ...get().draft, ...patch };
    kvStorage.setString(TRIP_STORAGE_KEY, JSON.stringify(draft));
    set({ draft });
  };

  return {
    draft: loadDraft(),
    // A new location invalidates the contact entered for the old one.
    setPickup: (label, region) =>
      update({ pickupLabel: label, pickupRegion: region, pickupDetails: null }),
    setDrop: (label, region) => update({ dropLabel: label, dropRegion: region, dropDetails: null }),
    setPickupDetails: (details) => update({ pickupDetails: details }),
    setDropDetails: (details) => update({ dropDetails: details }),
    setSelectedVehicle: (vehicleId) => update({ selectedVehicleId: vehicleId }),
    setCouponCode: (code) => update({ couponCode: code }),
    resetDraft: () => {
      const { pickupLabel, pickupRegion, pickupDetails } = get().draft;
      update({ ...DEFAULT_DRAFT, pickupLabel, pickupRegion, pickupDetails });
    },
    reset: () => update(DEFAULT_DRAFT),
  };
});

export const useTripStore = createSelectors(_useTripStore);
