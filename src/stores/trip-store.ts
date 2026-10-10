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

/** One delivery stop while it is being filled in. */
export interface DraftStop {
  label: string;
  address: string;
  region: PickedRegion | null;
  details: StopDetails | null;
}

const EMPTY_STOP: DraftStop = { label: '', address: '', region: null, details: null };

export interface TripDraft {
  pickupLabel: string;
  /** Area line shown under the label (city, state…); empty when unknown. */
  pickupAddress: string;
  pickupRegion: PickedRegion | null;
  pickupDetails: StopDetails | null;
  dropLabel: string;
  dropAddress: string;
  dropRegion: PickedRegion | null;
  dropDetails: StopDetails | null;
  /** Extra stops visited, in order, before the final drop (multi-stop bookings). */
  midStops: DraftStop[];
  selectedVehicleId: string | null;
  couponCode: string | null;
}

// Hans Bhawan Wing-1, IP Estate, New Delhi — the demo's default pickup.
const DEFAULT_DRAFT: TripDraft = {
  pickupLabel: 'Hans Bhawan Wing-1, IP Estate, New Delhi',
  pickupAddress: 'New Delhi, Delhi, India',
  pickupRegion: { latitude: 28.628, longitude: 77.2405 },
  pickupDetails: null,
  dropLabel: '',
  dropAddress: '',
  dropRegion: null,
  dropDetails: null,
  midStops: [],
  selectedVehicleId: null,
  couponCode: null,
};

/** Every delivery stop in visiting order; the last one is the final drop. */
export function draftStops(draft: TripDraft): DraftStop[] {
  return [
    ...draft.midStops,
    {
      label: draft.dropLabel,
      address: draft.dropAddress,
      region: draft.dropRegion,
      details: draft.dropDetails,
    },
  ];
}

/** Inverse of `draftStops`: the last stop becomes the drop, the rest the mid stops. */
function stopsPatch(stops: DraftStop[]): Partial<TripDraft> {
  const final = stops[stops.length - 1] ?? EMPTY_STOP;
  return {
    midStops: stops.slice(0, -1),
    dropLabel: final.label,
    dropAddress: final.address,
    dropRegion: final.region,
    dropDetails: final.details,
  };
}

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
  setPickup: (label: string, region: PickedRegion | null, address?: string) => void;
  setDrop: (label: string, region: PickedRegion | null, address?: string) => void;
  setPickupDetails: (details: StopDetails) => void;
  setDropDetails: (details: StopDetails) => void;
  /** Multi-stop editing — `index` is a position in `draftStops`. */
  setStopLocation: (
    index: number,
    label: string,
    region: PickedRegion | null,
    address?: string,
  ) => void;
  setStopDetails: (index: number, details: StopDetails) => void;
  /** Appends an empty stop, which becomes the new final drop. */
  addStop: () => void;
  removeStop: (index: number) => void;
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
    setPickup: (label, region, address = '') =>
      update({
        pickupLabel: label,
        pickupAddress: address,
        pickupRegion: region,
        pickupDetails: null,
      }),
    setDrop: (label, region, address = '') =>
      update({ dropLabel: label, dropAddress: address, dropRegion: region, dropDetails: null }),
    setPickupDetails: (details) => update({ pickupDetails: details }),
    setDropDetails: (details) => update({ dropDetails: details }),
    setStopLocation: (index, label, region, address = '') => {
      const stops = draftStops(get().draft);
      if (!stops[index]) return;
      // A new location invalidates the contact entered for the old one.
      stops[index] = { label, address, region, details: null };
      update(stopsPatch(stops));
    },
    setStopDetails: (index, details) => {
      const stops = draftStops(get().draft);
      if (!stops[index]) return;
      stops[index] = { ...stops[index], details };
      update(stopsPatch(stops));
    },
    addStop: () => update(stopsPatch([...draftStops(get().draft), EMPTY_STOP])),
    removeStop: (index) =>
      update(stopsPatch(draftStops(get().draft).filter((_, position) => position !== index))),
    setSelectedVehicle: (vehicleId) => update({ selectedVehicleId: vehicleId }),
    setCouponCode: (code) => update({ couponCode: code }),
    resetDraft: () => {
      const { pickupLabel, pickupAddress, pickupRegion, pickupDetails } = get().draft;
      update({ ...DEFAULT_DRAFT, pickupLabel, pickupAddress, pickupRegion, pickupDetails });
    },
    reset: () => update(DEFAULT_DRAFT),
  };
});

export const useTripStore = createSelectors(_useTripStore);
