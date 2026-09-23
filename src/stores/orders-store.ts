import { create } from 'zustand';

import { ordersEndpoints } from '@/data/mock';
import { kvStorage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';
import type { PickedRegion } from '@/stores/trip-store';

const ORDERS_STORAGE_KEY = 'orders_store_v1';

export type PaymentTiming = 'on-pickup' | 'on-delivery';

export type OrderStage =
  'searching' | 'heading_to_pickup' | 'pickup_complete' | 'delivered' | 'cancelled';

export interface OrderDriver {
  id: string;
  name: string;
  rating: number;
  vehicleLabel: string;
  vehiclePlate: string;
  phone: string;
}

export interface OrderRecord {
  id: string;
  createdAt: number;
  pickupLabel: string;
  dropLabel: string;
  routeWaypoints: PickedRegion[];
  dropHouseNumber: string;
  dropLandmark: string;
  receiverName: string;
  receiverPhone: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImageKey: string;
  /** Amount payable after any coupon discount. */
  price: number;
  /** Coupon discount already taken off `price`. */
  discount: number;
  couponCode: string | null;
  distanceKm: number | null;
  etaMinutes: number;
  paymentMethod: string;
  timing: PaymentTiming;
  pickupOtp: string;
  driver: OrderDriver;
  driverAllocationAt: number;
  cancelledAt: number | null;
  /** Customer's 1–5 star rating of the driver, once delivered. */
  rating: number | null;
}

export interface CreateOrderInput {
  pickupLabel: string;
  dropLabel: string;
  routeWaypoints?: PickedRegion[];
  dropHouseNumber?: string;
  dropLandmark?: string;
  receiverName?: string;
  receiverPhone?: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImageKey: string;
  price: number;
  discount?: number;
  couponCode?: string | null;
  distanceKm?: number | null;
  etaMinutes: number;
  paymentMethod: string;
  timing: PaymentTiming;
}

// Fixed window from "pickup complete" to "delivered" — the allocation wait is
// the only randomized leg the product asked for; the rest of the trip just
// needs to feel like it is progressing.
export const DELIVERY_DURATION_MS = 1 * 60_000;
// Prototype driver-matching wait, kept short so a demo moves along.
const MIN_ALLOCATION_MS = 8_000;
const MAX_ALLOCATION_MS = 25_000;

const DEMO_DRIVERS: OrderDriver[] = ordersEndpoints.availableDriversEndpoint.data;

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
    const parsed = JSON.parse(raw) as Partial<{
      orders: Record<string, StoredOrder>;
      activeOrderId: string | null;
    }>;
    return {
      orders: normalizeOrders(parsed.orders ?? {}),
      activeOrderId: parsed.activeOrderId ?? null,
    };
  } catch {
    return { orders: {}, activeOrderId: null };
  }
}

// Orders saved by older builds predate the coupon, distance and rating fields.
type AddedOrderFields = 'discount' | 'couponCode' | 'distanceKm' | 'rating';
type StoredOrder = Omit<OrderRecord, AddedOrderFields> &
  Partial<Pick<OrderRecord, AddedOrderFields>>;

function normalizeOrders(orders: Record<string, StoredOrder>): Record<string, OrderRecord> {
  return Object.fromEntries(
    Object.entries(orders).map(([id, order]) => [
      id,
      {
        ...order,
        discount: order.discount ?? 0,
        couponCode: order.couponCode ?? null,
        distanceKm: order.distanceKm ?? null,
        rating: order.rating ?? null,
      },
    ]),
  );
}

function persist(state: PersistedShape): void {
  kvStorage.setString(ORDERS_STORAGE_KEY, JSON.stringify(state));
}

type OrdersState = PersistedShape & {
  createOrder: (input: CreateOrderInput) => string;
  /** Cancels an order that hasn't been picked up yet. Returns whether it was cancelled. */
  cancelOrder: (id: string) => boolean;
  rateOrder: (id: string, rating: number) => void;
  clearActiveOrder: () => void;
  reset: () => void;
};

const _useOrdersStore = create<OrdersState>((set, get) => ({
  ...loadPersistedState(),

  createOrder: (input) => {
    const id = generateOrderId();
    const driver = DEMO_DRIVERS[randomIntBetween(0, DEMO_DRIVERS.length - 1)];
    const allocationDelayMs = randomIntBetween(MIN_ALLOCATION_MS, MAX_ALLOCATION_MS);

    const order: OrderRecord = {
      id,
      createdAt: Date.now(),
      pickupLabel: input.pickupLabel,
      dropLabel: input.dropLabel,
      routeWaypoints: input.routeWaypoints ?? [],
      dropHouseNumber: input.dropHouseNumber ?? '',
      dropLandmark: input.dropLandmark ?? '',
      receiverName: input.receiverName ?? '',
      receiverPhone: input.receiverPhone ?? '',
      vehicleId: input.vehicleId,
      vehicleName: input.vehicleName,
      vehicleImageKey: input.vehicleImageKey,
      price: input.price,
      discount: input.discount ?? 0,
      couponCode: input.couponCode ?? null,
      distanceKm: input.distanceKm ?? null,
      etaMinutes: input.etaMinutes,
      paymentMethod: input.paymentMethod,
      timing: input.timing,
      pickupOtp: generateOtp(),
      driver,
      driverAllocationAt: Date.now() + allocationDelayMs,
      cancelledAt: null,
      rating: null,
    };

    const orders = { ...get().orders, [id]: order };
    const next = { orders, activeOrderId: id };
    persist(next);
    set(next);
    return id;
  },

  cancelOrder: (id) => {
    const existing = get().orders[id];
    if (!existing || !canCancelOrder(existing, Date.now())) return false;

    const orders = { ...get().orders, [id]: { ...existing, cancelledAt: Date.now() } };
    const activeOrderId = get().activeOrderId === id ? null : get().activeOrderId;
    const next = { orders, activeOrderId };
    persist(next);
    set(next);
    return true;
  },

  rateOrder: (id, rating) => {
    const existing = get().orders[id];
    if (!existing) return;

    const orders = { ...get().orders, [id]: { ...existing, rating } };
    const next = { orders, activeOrderId: get().activeOrderId };
    persist(next);
    set({ orders });
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

/** Orders can be cancelled until the driver has collected the package. */
export function canCancelOrder(order: OrderRecord, now: number): boolean {
  const stage = resolveOrderStage(order, now);
  return stage === 'searching' || stage === 'heading_to_pickup';
}
