import { create } from 'zustand';

import type { GeoPoint } from '@/lib/api/models';
import { createSelectors } from '@/lib/create-selectors';
import { kvStorage } from '@/lib/storage';

/**
 * The booking being built across screens (addresses → vehicle → checkout).
 * Pure client state: nothing here is sent to the server until the order is
 * created. Saved addresses live in the query cache, not here.
 */

// v3: drops the demo pickup that v2 drafts were seeded with.
const TRIP_STORAGE_KEY = 'trip_draft_v3';

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
  /** Street address of a saved place whose label is a nickname ("Office"); sent with the order. */
  street?: string;
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
  /** See `DraftStop.street`. */
  pickupStreet?: string;
  /** The pickup is left over from the last booking, not chosen for this one, so current location may replace it. */
  isPickupCarriedOver: boolean;
  dropLabel: string;
  dropAddress: string;
  dropRegion: PickedRegion | null;
  dropDetails: StopDetails | null;
  dropStreet?: string;
  /** Extra stops visited, in order, before the final drop (multi-stop bookings). */
  midStops: DraftStop[];
  selectedVehicleId: string | null;
  couponCode: string | null;
}

// No preset pickup: the customer chooses it (current location or search).
const DEFAULT_DRAFT: TripDraft = {
  pickupLabel: '',
  pickupAddress: '',
  pickupRegion: null,
  pickupDetails: null,
  isPickupCarriedOver: false,
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
      street: draft.dropStreet,
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
    dropStreet: final.street,
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
  setPickup: (
    label: string,
    region: PickedRegion | null,
    address?: string,
    street?: string,
  ) => void;
  setDrop: (label: string, region: PickedRegion | null, address?: string, street?: string) => void;
  setPickupDetails: (details: StopDetails) => void;
  setDropDetails: (details: StopDetails) => void;
  /** Multi-stop editing — `index` is a position in `draftStops`. */
  setStopLocation: (
    index: number,
    label: string,
    region: PickedRegion | null,
    address?: string,
    street?: string,
  ) => void;
  setStopDetails: (index: number, details: StopDetails) => void;
  /** Appends an empty stop, which becomes the new final drop. */
  addStop: () => void;
  removeStop: (index: number) => void;
  /** Moves a stop to another position (drag to reorder); the rest keep their order. */
  moveStop: (from: number, to: number) => void;
  /**
   * Reverses the trip: the drop becomes the pickup and the other way round (extra stops reverse
   * too). Each place keeps its contact: the person there is the same, only their role changes.
   */
  swapPickupAndDrop: () => void;
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
    setPickup: (label, region, address = '', street) =>
      update({
        pickupLabel: label,
        pickupAddress: address,
        pickupStreet: street,
        pickupRegion: region,
        pickupDetails: null,
        isPickupCarriedOver: false,
      }),
    setDrop: (label, region, address = '', street) =>
      update({
        dropLabel: label,
        dropAddress: address,
        dropStreet: street,
        dropRegion: region,
        dropDetails: null,
      }),
    setPickupDetails: (details) => update({ pickupDetails: details }),
    setDropDetails: (details) => update({ dropDetails: details }),
    setStopLocation: (index, label, region, address = '', street) => {
      const stops = draftStops(get().draft);
      if (!stops[index]) return;
      // A new location invalidates the contact entered for the old one.
      stops[index] = { label, address, street, region, details: null };
      update(stopsPatch(stops));
    },
    setStopDetails: (index, details) => {
      const stops = draftStops(get().draft);
      if (!stops[index]) return;
      stops[index] = { ...stops[index], details };
      update(stopsPatch(stops));
    },
    addStop: () => update(stopsPatch([...draftStops(get().draft), EMPTY_STOP])),
    moveStop: (from, to) => {
      const stops = draftStops(get().draft);
      if (from === to || !stops[from] || to < 0 || to >= stops.length) return;
      const [moved] = stops.splice(from, 1);
      stops.splice(to, 0, moved);
      update(stopsPatch(stops));
    },
    removeStop: (index) =>
      update(stopsPatch(draftStops(get().draft).filter((_, position) => position !== index))),
    swapPickupAndDrop: () => {
      const { draft } = get();
      const pickup: DraftStop = {
        label: draft.pickupLabel,
        address: draft.pickupAddress,
        street: draft.pickupStreet,
        region: draft.pickupRegion,
        details: draft.pickupDetails,
      };
      const [newPickup, ...rest] = [pickup, ...draftStops(draft)].reverse();
      update({
        pickupLabel: newPickup.label,
        pickupAddress: newPickup.address,
        pickupStreet: newPickup.street,
        pickupRegion: newPickup.region,
        pickupDetails: newPickup.details,
        isPickupCarriedOver: false,
        ...stopsPatch(rest),
      });
    },
    setSelectedVehicle: (vehicleId) => update({ selectedVehicleId: vehicleId }),
    setCouponCode: (code) => update({ couponCode: code }),
    resetDraft: () => {
      const { pickupLabel, pickupAddress, pickupStreet, pickupRegion, pickupDetails } = get().draft;
      update({
        ...DEFAULT_DRAFT,
        pickupLabel,
        pickupAddress,
        pickupStreet,
        pickupRegion,
        pickupDetails,
        isPickupCarriedOver: Boolean(pickupRegion),
      });
    },
    reset: () => update(DEFAULT_DRAFT),
  };
});

export const useTripStore = createSelectors(_useTripStore);
