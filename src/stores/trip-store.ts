import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GeoPoint, Order, OrderStop } from '@/lib/api/models';
import { mmkvStateStorage } from '@/lib/storage';

const TRIP_STORAGE_KEY = 'trip_draft_v3';

export type PickedRegion = GeoPoint;

export interface StopDetails {
  houseNumber: string;
  contactName: string;
  contactPhone: string;
}

export interface DraftStop {
  label: string;
  address: string;
  street?: string;
  region: PickedRegion | null;
  details: StopDetails | null;
}

const EMPTY_STOP: DraftStop = { label: '', address: '', region: null, details: null };

export interface TripDraft {
  pickupLabel: string;
  pickupAddress: string;
  pickupRegion: PickedRegion | null;
  pickupDetails: StopDetails | null;
  pickupStreet?: string;
  isPickupCarriedOver: boolean;
  dropLabel: string;
  dropAddress: string;
  dropRegion: PickedRegion | null;
  dropDetails: StopDetails | null;
  dropStreet?: string;
  midStops: DraftStop[];
  selectedVehicleId: string | null;
  couponCode: string | null;
  /** Ask for a priority booking (quoted again with `priority: true`). */
  priority: boolean;
}

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
  priority: false,
};

function detailsFromOrderStop(stop: OrderStop): StopDetails | null {
  const { contact } = stop;
  if (!contact || (!contact.name && !contact.phone)) return null;
  return {
    houseNumber: stop.houseNumber,
    contactName: contact.name ?? '',
    contactPhone: contact.phone ?? '',
  };
}

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
  setStopLocation: (
    index: number,
    label: string,
    region: PickedRegion | null,
    address?: string,
    street?: string,
  ) => void;
  setStopDetails: (index: number, details: StopDetails) => void;
  addStop: () => void;
  removeStop: (index: number) => void;
  moveStop: (from: number, to: number) => void;
  swapPickupAndDrop: () => void;
  setSelectedVehicle: (vehicleId: string) => void;
  setCouponCode: (code: string | null) => void;
  setPriority: (priority: boolean) => void;
  rebookFromOrder: (order: Pick<Order, 'pickup' | 'drop'>, vehicleId: string | null) => void;
  resetDraft: (carriedOver?: boolean) => void;
  reset: () => void;
};

const _useTripStore = create<TripState>()(
  persist(
    (set, get) => {
      const update = (patch: Partial<TripDraft>) =>
        set((state) => ({ draft: { ...state.draft, ...patch } }));

      return {
        draft: DEFAULT_DRAFT,
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
        setPriority: (priority) => update({ priority }),
        rebookFromOrder: (order, vehicleId) =>
          update({
            pickupLabel: order.pickup.label,
            pickupAddress: '',
            pickupStreet: order.pickup.street,
            pickupRegion: order.pickup.location,
            pickupDetails: detailsFromOrderStop(order.pickup),
            isPickupCarriedOver: false,
            dropLabel: order.drop.label,
            dropAddress: '',
            dropStreet: order.drop.street,
            dropRegion: order.drop.location,
            dropDetails: detailsFromOrderStop(order.drop),
            midStops: [],
            selectedVehicleId: vehicleId,
            couponCode: null,
            priority: false,
          }),
        resetDraft: (carriedOver = true) => {
          const { pickupLabel, pickupAddress, pickupStreet, pickupRegion, pickupDetails } =
            get().draft;
          update({
            ...DEFAULT_DRAFT,
            pickupLabel,
            pickupAddress,
            pickupStreet,
            pickupRegion,
            pickupDetails,
            isPickupCarriedOver: carriedOver && Boolean(pickupRegion),
          });
        },
        reset: () => update(DEFAULT_DRAFT),
      };
    },
    {
      name: TRIP_STORAGE_KEY,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ draft: state.draft }),
      merge: (persisted, current) => ({
        ...current,
        draft: {
          ...DEFAULT_DRAFT,
          ...(persisted as { draft?: Partial<TripDraft> } | undefined)?.draft,
        },
      }),
    },
  ),
);

export const useTripStore = _useTripStore;
