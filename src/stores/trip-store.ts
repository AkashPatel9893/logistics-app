import { create } from 'zustand';

import { placesEndpoints } from '@/data/mock';
import { kvStorage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const TRIP_STORAGE_KEY = 'trip_store_v1';
const MAX_ADDRESSES = 12;
export const MAX_STOPS = 3;

export type LocationIconType = 'recent' | 'work' | 'home' | 'other';

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  iconType: LocationIconType;
  isFavorited: boolean;
  savedAt: number;
}

export interface PickedRegion {
  latitude: number;
  longitude: number;
}

export type SaveAddressTag = 'home' | 'work' | 'other';

export interface DropAddressDetails {
  houseNumber: string;
  landmark: string;
  receiverName: string;
  receiverPhone: string;
  saveAsTag: SaveAddressTag | null;
}

export interface TripStop {
  id: string;
  name: string;
  address: string;
}

export interface TripDraft {
  pickupLabel: string;
  dropLabel: string;
  dropRegion: PickedRegion | null;
  selectedVehicleId: string | null;
  dropDetails: DropAddressDetails | null;
  stops: TripStop[];
}

export const EMPTY_DROP_DETAILS: DropAddressDetails = {
  houseNumber: '',
  landmark: '',
  receiverName: '',
  receiverPhone: '',
  saveAsTag: null,
};

const SEED_ADDRESSES: SavedAddress[] = placesEndpoints.savedAddressesEndpoint.data.map((addr) => ({
  ...addr,
  iconType: addr.iconType as LocationIconType,
}));

const DEFAULT_DRAFT: TripDraft = {
  pickupLabel: 'Hans Bhawan Wing-1, IP Estate, New Delhi',
  dropLabel: '',
  dropRegion: null,
  selectedVehicleId: null,
  dropDetails: null,
  stops: [],
};

type PersistedShape = {
  addresses: SavedAddress[];
  draft: TripDraft;
};

function loadPersistedState(): PersistedShape {
  const raw = kvStorage.getString(TRIP_STORAGE_KEY);
  if (!raw) return { addresses: SEED_ADDRESSES, draft: DEFAULT_DRAFT };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    const addresses =
      Array.isArray(parsed.addresses) && parsed.addresses.length > 0
        ? parsed.addresses
        : SEED_ADDRESSES;
    const stops = Array.isArray(parsed.draft?.stops) ? parsed.draft.stops : [];
    return { addresses, draft: { ...DEFAULT_DRAFT, ...parsed.draft, stops } };
  } catch {
    return { addresses: SEED_ADDRESSES, draft: DEFAULT_DRAFT };
  }
}

function persist(state: PersistedShape): void {
  kvStorage.setString(TRIP_STORAGE_KEY, JSON.stringify(state));
}

interface SelectDropAddressInput {
  id?: string;
  name: string;
  address: string;
}

type TripState = PersistedShape & {
  selectDropAddress: (address: SelectDropAddressInput) => void;
  setDropRegionLabel: (region: PickedRegion, label: string) => void;
  setDropAddressDetails: (details: DropAddressDetails) => void;
  toggleFavoriteAddress: (id: string) => void;
  setSelectedVehicle: (vehicleId: string) => void;
  addStop: (address: SelectDropAddressInput) => void;
  removeStop: (id: string) => void;
  resetDraft: () => void;
  reset: () => void;
};

const _useTripStore = create<TripState>((set, get) => ({
  ...loadPersistedState(),

  selectDropAddress: (address) => {
    const existing = get().addresses.find(
      (a) => a.name.toLowerCase() === address.name.toLowerCase() && a.address === address.address,
    );

    let addresses = get().addresses;
    if (existing) {
      addresses = [existing, ...addresses.filter((a) => a.id !== existing.id)];
    } else {
      const newAddress: SavedAddress = {
        id:
          address.id ?? `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: address.name,
        address: address.address,
        iconType: 'recent',
        isFavorited: false,
        savedAt: Date.now(),
      };
      addresses = [newAddress, ...addresses].slice(0, MAX_ADDRESSES);
    }

    const draft: TripDraft = {
      ...get().draft,
      dropLabel: address.name,
      dropRegion: null,
      dropDetails: null,
    };
    const next = { addresses, draft };
    persist(next);
    set(next);
  },

  setDropRegionLabel: (region, label) => {
    const draft: TripDraft = {
      ...get().draft,
      dropLabel: label,
      dropRegion: region,
      dropDetails: null,
    };
    const next = { addresses: get().addresses, draft };
    persist(next);
    set({ draft });
  },

  setDropAddressDetails: (details) => {
    const draft: TripDraft = { ...get().draft, dropDetails: details };

    let addresses = get().addresses;
    if (details.saveAsTag === 'home' || details.saveAsTag === 'work') {
      const label = [draft.dropLabel, details.houseNumber, details.landmark]
        .filter(Boolean)
        .join(', ');
      const existing = addresses.find((a) => a.iconType === details.saveAsTag);
      const savedAddress: SavedAddress = {
        id: existing?.id ?? `addr_${details.saveAsTag}`,
        name: details.saveAsTag === 'home' ? 'Home' : 'Work',
        address: label,
        iconType: details.saveAsTag,
        isFavorited: existing?.isFavorited ?? true,
        savedAt: Date.now(),
      };
      addresses = [savedAddress, ...addresses.filter((a) => a.id !== savedAddress.id)].slice(
        0,
        MAX_ADDRESSES,
      );
    }

    const next = { addresses, draft };
    persist(next);
    set(next);
  },

  toggleFavoriteAddress: (id) => {
    const addresses = get().addresses.map((a) =>
      a.id === id ? { ...a, isFavorited: !a.isFavorited } : a,
    );
    const next = { addresses, draft: get().draft };
    persist(next);
    set({ addresses });
  },

  setSelectedVehicle: (vehicleId) => {
    const draft: TripDraft = { ...get().draft, selectedVehicleId: vehicleId };
    const next = { addresses: get().addresses, draft };
    persist(next);
    set({ draft });
  },

  addStop: (address) => {
    const currentStops = get().draft.stops;
    if (currentStops.length >= MAX_STOPS) return;

    const stop: TripStop = {
      id: address.id ?? `stop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: address.name,
      address: address.address,
    };
    const draft: TripDraft = { ...get().draft, stops: [...currentStops, stop] };
    const next = { addresses: get().addresses, draft };
    persist(next);
    set({ draft });
  },

  removeStop: (id) => {
    const draft: TripDraft = {
      ...get().draft,
      stops: get().draft.stops.filter((s) => s.id !== id),
    };
    const next = { addresses: get().addresses, draft };
    persist(next);
    set({ draft });
  },

  resetDraft: () => {
    const draft: TripDraft = { ...DEFAULT_DRAFT, pickupLabel: get().draft.pickupLabel };
    const next = { addresses: get().addresses, draft };
    persist(next);
    set({ draft });
  },

  reset: () => {
    const next = { addresses: SEED_ADDRESSES, draft: DEFAULT_DRAFT };
    persist(next);
    set(next);
  },
}));

export const useTripStore = createSelectors(_useTripStore);
