import { request } from './client';
import { ApiError } from './api-error';
import type { AddPaymentMethodInput, Wallet, WalletTransaction } from './models';

export const walletApi = {
  get: async (signal?: AbortSignal): Promise<Wallet> => {
    const res = await request<any>({ url: '/wallet', signal });
    const txs = await request<any[]>({ url: '/wallet/transactions', signal });
    const transactions: WalletTransaction[] = txs.map((t: any) => ({
      id: t.id,
      title: t.title ?? t.kind,
      amount: Number(t.amount),
      createdAt: t.created_at,
      kind: Number(t.amount) >= 0 ? ('credit' as const) : ('debit' as const),
    }));
    return {
      balance: Number(res.balance ?? 0),
      paymentMethods: [
        { id: 'pm-cash', type: 'cash', label: 'Cash', subtitle: 'Pay the driver in cash' },
      ],
      defaultPaymentMethodId: 'pm-cash',
      transactions,
    };
  },

  topUp: async (amount: number): Promise<Wallet> => {
    const res = await request<any>({ method: 'POST', url: '/wallet/topups', data: { amount } });
    return {
      balance: Number(res.balance ?? amount),
      paymentMethods: [
        { id: 'pm-cash', type: 'cash', label: 'Cash', subtitle: 'Pay the driver in cash' },
      ],
      defaultPaymentMethodId: 'pm-cash',
      transactions: [],
    };
  },

  addPaymentMethod: async (_input: AddPaymentMethodInput): Promise<Wallet> => {
    throw new ApiError('Adding a payment method is not available yet.', 'unknown');
  },

  setDefaultPaymentMethod: async (_paymentMethodId: string): Promise<Wallet> => {
    if (_paymentMethodId === 'pm-cash') return walletApi.get();
    throw new ApiError('Changing the payment method is not available yet.', 'unknown');
  },
};
