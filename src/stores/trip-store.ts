import { create } from 'zustand';

import {
  getSavedAddresses,
  resetSavedAddresses,
  toggleFavoriteSavedAddress,
  touchSavedAddress,
  updateSavedAddress,
  updateSavedAddressContact,
  type SavedAddressContact,
} from '@/features/home/addresses-api';
import { kvStorage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const TRIP_STORAGE_KEY = 'trip_store_v1';

export type LocationIconType = 'recent' | 'work' | 'home' | 'other';

export interface PickedRegion {
  latitude: number;
  longitude: number;
}

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  iconType: LocationIconType;
  isFavorited: boolean;
  savedAt: number;
  region?: PickedRegion | null;
  // Contact info last used at this address (sender or receiver — whichever
  // was entered), remembered so the details modal can pre-fill next time.
  houseNumber?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface DropAddressDetails {
  houseNumber: string;
  receiverName: string;
  receiverPhone: string;
}

export interface PickupAddressDetails {
  houseNumber: string;
  senderName: string;
  senderPhone: string;
}

export interface TripDraft {
  pickupLabel: string;
  pickupRegion: PickedRegion | null;
  pickupDetails: PickupAddressDetails | null;
  dropLabel: string;
  dropRegion: PickedRegion | null;
  dropDetails: DropAddressDetails | null;
  selectedVehicleId: string | null;
  couponCode: string | null;
}

// Hans Bhawan Wing-1, IP Estate, New Delhi — matches the fixed default pickupLabel below.
const DEFAULT_PICKUP_REGION: PickedRegion = { latitude: 28.628, longitude: 77.2405 };

export const EMPTY_DROP_DETAILS: DropAddressDetails = {
  houseNumber: '',
  receiverName: '',
  receiverPhone: '',
};

export const EMPTY_PICKUP_DETAILS: PickupAddressDetails = {
  houseNumber: '',
  senderName: '',
  senderPhone: '',
};

const DEFAULT_DRAFT: TripDraft = {
  pickupLabel: 'Hans Bhawan Wing-1, IP Estate, New Delhi',
  pickupRegion: DEFAULT_PICKUP_REGION,
  pickupDetails: null,
  dropLabel: '',
  dropRegion: null,
  dropDetails: null,
  selectedVehicleId: null,
  couponCode: null,
};

// Saved addresses are owned by `addresses-api` (async, ApiResponse-shaped —
// see that file) and loaded into the store below; only the trip draft is
// client-only state persisted directly here.
function loadPersistedDraft(): TripDraft {
  const raw = kvStorage.getString(TRIP_STORAGE_KEY);
  if (!raw) return DEFAULT_DRAFT;
  try {
    const parsed = JSON.parse(raw) as Partial<{ draft: Partial<TripDraft> }>;
    return { ...DEFAULT_DRAFT, ...parsed.draft };
  } catch {
    return DEFAULT_DRAFT;
  }
}

function persistDraft(draft: TripDraft): void {
  kvStorage.setString(TRIP_STORAGE_KEY, JSON.stringify({ draft }));
}

interface SelectDropAddressInput {
  id?: string;
  name: string;
  address: string;
  region?: PickedRegion | null;
}

type TripState = {
  addresses: SavedAddress[];
  draft: TripDraft;
  isLoadingAddresses: boolean;
  selectDropAddress: (address: SelectDropAddressInput) => Promise<void>;
  selectPickupAddress: (address: SelectDropAddressInput) => Promise<void>;
  setDropRegionLabel: (region: PickedRegion, label: string) => void;
  setPickupLocation: (region: PickedRegion, label: string) => void;
  setDropAddressDetails: (details: DropAddressDetails) => void;
  setPickupAddressDetails: (details: PickupAddressDetails) => void;
  toggleFavoriteAddress: (id: string) => Promise<void>;
  updateAddress: (
    id: string,
    updates: { name: string; address: string; region?: PickedRegion | null },
  ) => Promise<void>;
  setSavedAddressContact: (id: string, contact: SavedAddressContact) => Promise<void>;
  setSelectedVehicle: (vehicleId: string) => void;
  setCouponCode: (code: string | null) => void;
  resetDraft: () => void;
  reset: () => Promise<void>;
};

const _useTripStore = create<TripState>((set, get) => ({
  addresses: [],
  draft: loadPersistedDraft(),
  isLoadingAddresses: true,

  selectDropAddress: async (address) => {
    const res = await touchSavedAddress({
      id: address.id,
      name: address.name,
      address: address.address,
      region: address.region,
    });

    const draft: TripDraft = {
      ...get().draft,
      dropLabel: address.name,
      dropRegion: address.region ?? null,
      dropDetails: null,
    };
    persistDraft(draft);
    set({ addresses: res.data, draft });
  },

  selectPickupAddress: async (address) => {
    const res = await touchSavedAddress({
      id: address.id,
      name: address.name,
      address: address.address,
      region: address.region,
    });

    const draft: TripDraft = {
      ...get().draft,
      pickupLabel: address.name,
      pickupRegion: address.region ?? null,
      pickupDetails: null,
    };
    persistDraft(draft);
    set({ addresses: res.data, draft });
  },

  setDropRegionLabel: (region, label) => {
    const draft: TripDraft = {
      ...get().draft,
      dropLabel: label,
      dropRegion: region,
      dropDetails: null,
    };
    persistDraft(draft);
    set({ draft });
  },

  setPickupLocation: (region, label) => {
    const draft: TripDraft = {
      ...get().draft,
      pickupLabel: label,
      pickupRegion: region,
      pickupDetails: null,
    };
    persistDraft(draft);
    set({ draft });
  },

  setDropAddressDetails: (details) => {
    const draft: TripDraft = { ...get().draft, dropDetails: details };
    persistDraft(draft);
    set({ draft });
  },

  setPickupAddressDetails: (details) => {
    const draft: TripDraft = { ...get().draft, pickupDetails: details };
    persistDraft(draft);
    set({ draft });
  },

  toggleFavoriteAddress: async (id) => {
    const res = await toggleFavoriteSavedAddress(id);
    set({ addresses: res.data });
  },

  updateAddress: async (id, updates) => {
    const res = await updateSavedAddress(id, updates);
    set({ addresses: res.data });
  },

  setSavedAddressContact: async (id, contact) => {
    const res = await updateSavedAddressContact(id, contact);
    set({ addresses: res.data });
  },

  setSelectedVehicle: (vehicleId) => {
    const draft: TripDraft = { ...get().draft, selectedVehicleId: vehicleId };
    persistDraft(draft);
    set({ draft });
  },

  setCouponCode: (code) => {
    const draft: TripDraft = { ...get().draft, couponCode: code };
    persistDraft(draft);
    set({ draft });
  },

  resetDraft: () => {
    const draft: TripDraft = {
      ...DEFAULT_DRAFT,
      pickupLabel: get().draft.pickupLabel,
      pickupRegion: get().draft.pickupRegion,
      pickupDetails: get().draft.pickupDetails,
      // A coupon picked from an offer banner or the coupons list stays
      // selected until it is used on a booking or removed.
      couponCode: get().draft.couponCode,
    };
    persistDraft(draft);
    set({ draft });
  },

  reset: async () => {
    persistDraft(DEFAULT_DRAFT);
    const res = await resetSavedAddresses();
    set({ addresses: res.data, draft: DEFAULT_DRAFT });
  },
}));

// Hydrate saved addresses from the API layer on store creation (mirrors a
// real app's initial fetch — see `addresses-api.ts`).
getSavedAddresses().then((res) => {
  _useTripStore.setState({ addresses: res.data, isLoadingAddresses: false });
});

export const useTripStore = createSelectors(_useTripStore);
