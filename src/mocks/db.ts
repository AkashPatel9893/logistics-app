/**
 * Mock backend "database": JSON tables persisted to MMKV so data survives app
 * restarts, like a real server would keep it. Namespaced away from app data.
 */
import type {
  AuthSession,
  Order,
  PaymentMethod,
  SavedAddress,
  User,
  WalletTransaction,
} from '@/lib/api/models';
import { kvStorage } from '@/lib/storage';

const PREFIX = 'mock_db_v2:';

class Table<T> {
  private cache: Record<string, T> | null = null;

  constructor(private readonly name: string) {}

  private load(): Record<string, T> {
    if (this.cache) return this.cache;
    const raw = kvStorage.getString(PREFIX + this.name);
    try {
      this.cache = raw ? (JSON.parse(raw) as Record<string, T>) : {};
    } catch {
      this.cache = {};
    }
    return this.cache;
  }

  private save(): void {
    kvStorage.setString(PREFIX + this.name, JSON.stringify(this.cache ?? {}));
  }

  get(id: string): T | undefined {
    return this.load()[id];
  }

  all(): T[] {
    return Object.values(this.load());
  }

  set(id: string, value: T): T {
    this.load()[id] = value;
    this.save();
    return value;
  }

  update(id: string, patch: (current: T) => T): T | undefined {
    const current = this.get(id);
    if (current === undefined) return undefined;
    return this.set(id, patch(current));
  }
}

/** Server-side order record: the public Order minus derived fields, plus owner. */
export interface OrderRecord extends Omit<Order, 'status' | 'driver'> {
  userId: string;
  /** Pre-picked driver, revealed once `driverAssignAt` passes. */
  assignedDriverId: string;
}

export interface WalletRecord {
  balance: number;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string;
  transactions: WalletTransaction[];
}

export interface ShareRecord {
  orderId: string;
  expiresAt: string;
}

export const db = {
  users: new Table<User>('users'),
  /** email → userId */
  usersByEmail: new Table<string>('users_by_email'),
  /** accessToken → session */
  sessions: new Table<Pick<AuthSession, 'accessToken' | 'refreshToken'> & { userId: string }>(
    'sessions',
  ),
  /** userId → addresses */
  addresses: new Table<SavedAddress[]>('addresses'),
  orders: new Table<OrderRecord>('orders'),
  wallets: new Table<WalletRecord>('wallets'),
  /** token → share */
  shares: new Table<ShareRecord>('shares'),
};
