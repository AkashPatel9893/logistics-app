import { create } from 'zustand';

import { kvStorage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const ORDERS_STORAGE_KEY = 'orders_store_v1';

export type OrderStage =
  'searching' | 'heading_to_pickup' | 'pickup_complete' | 'delivered' | 'cancelled';

export interface OrderDriver {
  id: string;
  name: string;
  rating: number;
  vehicleLabel: string;
  vehiclePlate: string;
}

export interface OrderRecord {
  id: string;
  createdAt: number;
  pickupLabel: string;
  dropLabel: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImageKey: string;
  price: number;
  etaMinutes: number;
  paymentMethod: string;
  timing: 'on-delivery' | 'on-pickup';
  pickupOtp: string;
  driver: OrderDriver;
  driverAllocationAt: number;
  cancelledAt: number | null;
}

export interface CreateOrderInput {
  pickupLabel: string;
  dropLabel: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImageKey: string;
  price: number;
  etaMinutes: number;
  paymentMethod: string;
  timing: 'on-delivery' | 'on-pickup';
}

// Fixed window from "pickup complete" to "delivered" — the allocation wait is
// the only randomized leg the product asked for; the rest of the trip just
// needs to feel like it is progressing.
export const DELIVERY_DURATION_MS = 3 * 60_000;
const MIN_ALLOCATION_MINUTES = 2;
const MAX_ALLOCATION_MINUTES = 4;

const DEMO_DRIVERS: OrderDriver[] = [
  {
    id: 'drv-1',
    name: 'Arun Kumar',
    rating: 4.9,
    vehicleLabel: 'Mini Truck',
    vehiclePlate: 'KA 03 MX 2814',
  },
  {
    id: 'drv-2',
    name: 'Rakesh Singh',
    rating: 4.8,
    vehicleLabel: 'Three-Wheeler',
    vehiclePlate: 'DL 4C AX 7710',
  },
  {
    id: 'drv-3',
    name: 'Suresh Yadav',
    rating: 4.7,
    vehicleLabel: 'Two-Wheeler',
    vehiclePlate: 'HR 26 BK 5521',
  },
  {
    id: 'drv-4',
    name: 'Manoj Sharma',
    rating: 4.95,
    vehicleLabel: 'E-Rickshaw',
    vehiclePlate: 'DL 1RA 3390',
  },
  {
    id: 'drv-5',
    name: 'Vikram Yadav',
    rating: 4.6,
    vehicleLabel: 'Pickup Truck',
    vehiclePlate: 'UP 16 CT 8843',
  },
];

function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOtp(): string {
  return String(randomIntBetween(1000, 9999));
}

function generateOrderId(): string {
  return `order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type PersistedShape = {
  orders: Record<string, OrderRecord>;
  activeOrderId: string | null;
};

function loadPersistedState(): PersistedShape {
  const raw = kvStorage.getString(ORDERS_STORAGE_KEY);
  if (!raw) return { orders: {}, activeOrderId: null };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      orders: parsed.orders ?? {},
      activeOrderId: parsed.activeOrderId ?? null,
    };
  } catch {
    return { orders: {}, activeOrderId: null };
  }
}

function persist(state: PersistedShape): void {
  kvStorage.setString(ORDERS_STORAGE_KEY, JSON.stringify(state));
}

type OrdersState = PersistedShape & {
  createOrder: (input: CreateOrderInput) => string;
  cancelOrder: (id: string) => void;
  clearActiveOrder: () => void;
  reset: () => void;
};

const _useOrdersStore = create<OrdersState>((set, get) => ({
  ...loadPersistedState(),

  createOrder: (input) => {
    const id = generateOrderId();
    const driver = DEMO_DRIVERS[randomIntBetween(0, DEMO_DRIVERS.length - 1)];
    const allocationDelayMs =
      randomIntBetween(MIN_ALLOCATION_MINUTES, MAX_ALLOCATION_MINUTES) * 60_000;

    const order: OrderRecord = {
      id,
      createdAt: Date.now(),
      pickupLabel: input.pickupLabel,
      dropLabel: input.dropLabel,
      vehicleId: input.vehicleId,
      vehicleName: input.vehicleName,
      vehicleImageKey: input.vehicleImageKey,
      price: input.price,
      etaMinutes: input.etaMinutes,
      paymentMethod: input.paymentMethod,
      timing: input.timing,
      pickupOtp: generateOtp(),
      driver,
      driverAllocationAt: Date.now() + allocationDelayMs,
      cancelledAt: null,
    };

    const orders = { ...get().orders, [id]: order };
    const next = { orders, activeOrderId: id };
    persist(next);
    set(next);
    return id;
  },

  cancelOrder: (id) => {
    const existing = get().orders[id];
    if (!existing) return;

    const orders = { ...get().orders, [id]: { ...existing, cancelledAt: Date.now() } };
    const activeOrderId = get().activeOrderId === id ? null : get().activeOrderId;
    const next = { orders, activeOrderId };
    persist(next);
    set(next);
  },

  clearActiveOrder: () => {
    const next = { orders: get().orders, activeOrderId: null };
    persist(next);
    set({ activeOrderId: null });
  },

  reset: () => {
    const next = { orders: {}, activeOrderId: null };
    persist(next);
    set(next);
  },
}));

export const useOrdersStore = createSelectors(_useOrdersStore);

export function resolveOrderStage(order: OrderRecord, now: number): OrderStage {
  if (order.cancelledAt) return 'cancelled';
  if (now < order.driverAllocationAt) return 'searching';

  const pickupCompleteAt = order.driverAllocationAt + order.etaMinutes * 60_000;
  if (now < pickupCompleteAt) return 'heading_to_pickup';

  const deliveredAt = pickupCompleteAt + DELIVERY_DURATION_MS;
  if (now < deliveredAt) return 'pickup_complete';

  return 'delivered';
}

export function isOrderActive(order: OrderRecord, now: number): boolean {
  const stage = resolveOrderStage(order, now);
  return stage !== 'delivered' && stage !== 'cancelled';
}
