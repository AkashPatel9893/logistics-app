import { create } from 'zustand';

import { walletEndpoints } from '@/data/mock';
import { kvStorage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const WALLET_STORAGE_KEY = 'wallet_store_v1';

export type PaymentMethodType = 'cash' | 'upi' | 'card' | 'paytm';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  subtitle: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  dateLabel: string;
  amount: number;
  kind: 'debit' | 'credit';
}

const SEED = walletEndpoints.walletSummaryEndpoint.data;
const SEED_PAYMENT_METHODS = SEED.paymentMethods as PaymentMethod[];
const SEED_TRANSACTIONS = SEED.transactions as WalletTransaction[];
const CASH_METHOD_ID = 'cash';

type PersistedShape = {
  balance: number;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: string;
  transactions: WalletTransaction[];
};

const DEFAULT_STATE: PersistedShape = {
  balance: SEED.balance,
  paymentMethods: SEED_PAYMENT_METHODS,
  selectedPaymentMethodId: CASH_METHOD_ID,
  transactions: SEED_TRANSACTIONS,
};

function loadPersistedState(): PersistedShape {
  const raw = kvStorage.getString(WALLET_STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      balance: parsed.balance ?? DEFAULT_STATE.balance,
      paymentMethods:
        Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0
          ? parsed.paymentMethods
          : DEFAULT_STATE.paymentMethods,
      selectedPaymentMethodId:
        parsed.selectedPaymentMethodId ?? DEFAULT_STATE.selectedPaymentMethodId,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : DEFAULT_STATE.transactions,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state: PersistedShape): void {
  kvStorage.setString(WALLET_STORAGE_KEY, JSON.stringify(state));
}

function generateMethodId(type: PaymentMethodType): string {
  return `${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateTransactionId(): string {
  return `txn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

type WalletState = PersistedShape & {
  selectPaymentMethod: (id: string) => void;
  addUpi: (upiId: string) => void;
  addCard: (cardNumber: string) => void;
  linkPaytm: () => void;
  topUp: (amount: number) => void;
};

const _useWalletStore = create<WalletState>((set, get) => ({
  ...loadPersistedState(),

  selectPaymentMethod: (id) => {
    const next = { ...get(), selectedPaymentMethodId: id };
    persist(next);
    set({ selectedPaymentMethodId: id });
  },

  addUpi: (upiId) => {
    const method: PaymentMethod = {
      id: generateMethodId('upi'),
      type: 'upi',
      label: upiId,
      subtitle: 'UPI',
    };
    const paymentMethods = [...get().paymentMethods, method];
    const next = { ...get(), paymentMethods, selectedPaymentMethodId: method.id };
    persist(next);
    set({ paymentMethods, selectedPaymentMethodId: method.id });
  },

  addCard: (cardNumber) => {
    const last4 = cardNumber.replace(/\D/g, '').slice(-4);
    const method: PaymentMethod = {
      id: generateMethodId('card'),
      type: 'card',
      label: `Card •••• ${last4}`,
      subtitle: 'Debit/Credit Card',
    };
    const paymentMethods = [...get().paymentMethods, method];
    const next = { ...get(), paymentMethods, selectedPaymentMethodId: method.id };
    persist(next);
    set({ paymentMethods, selectedPaymentMethodId: method.id });
  },

  linkPaytm: () => {
    const method: PaymentMethod = {
      id: generateMethodId('paytm'),
      type: 'paytm',
      label: 'Paytm Wallet',
      subtitle: 'Linked wallet',
    };
    const paymentMethods = [...get().paymentMethods, method];
    const next = { ...get(), paymentMethods, selectedPaymentMethodId: method.id };
    persist(next);
    set({ paymentMethods, selectedPaymentMethodId: method.id });
  },

  topUp: (amount) => {
    if (amount <= 0) return;
    const transaction: WalletTransaction = {
      id: generateTransactionId(),
      title: 'Wallet Top Up',
      dateLabel: todayLabel(),
      amount,
      kind: 'credit',
    };
    const balance = get().balance + amount;
    const transactions = [transaction, ...get().transactions];
    const next = { ...get(), balance, transactions };
    persist(next);
    set({ balance, transactions });
  },
}));

export const useWalletStore = createSelectors(_useWalletStore);
