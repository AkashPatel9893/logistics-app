import { request } from './client';
import type { AddPaymentMethodInput, Wallet, WalletTransaction } from './models';

export const walletApi = {
  get: async (signal?: AbortSignal): Promise<Wallet> => {
    try {
      const res = await request<any>({ url: '/wallet', signal });
      let transactions: WalletTransaction[] = [];
      try {
        const txs = await request<any[]>({ url: '/wallet/transactions', signal });
        if (Array.isArray(txs)) {
          transactions = txs.map((t: any) => ({
            id: t.id,
            title: t.title ?? t.kind,
            amount: Number(t.amount),
            createdAt: t.created_at,
            kind: Number(t.amount) >= 0 ? ('credit' as const) : ('debit' as const),
          }));
        }
      } catch {}
      return {
        balance: Number(res.balance ?? 0),
        paymentMethods: [
          { id: 'pm-upi', type: 'upi', label: 'UPI / Google Pay', subtitle: 'Instant Transfer' },
        ],
        defaultPaymentMethodId: 'pm-upi',
        transactions,
      };
    } catch {
      return {
        balance: 0,
        paymentMethods: [
          { id: 'pm-upi', type: 'upi', label: 'UPI / Google Pay', subtitle: 'Instant Transfer' },
        ],
        defaultPaymentMethodId: 'pm-upi',
        transactions: [],
      };
    }
  },

  topUp: async (amount: number): Promise<Wallet> => {
    const res = await request<any>({ method: 'POST', url: '/wallet/topups', data: { amount } });
    return {
      balance: Number(res.balance ?? amount),
      paymentMethods: [
        { id: 'pm-upi', type: 'upi', label: 'UPI / Google Pay', subtitle: 'Instant Transfer' },
      ],
      defaultPaymentMethodId: 'pm-upi',
      transactions: [],
    };
  },

  addPaymentMethod: async (_input: AddPaymentMethodInput): Promise<Wallet> => {
    return walletApi.get();
  },

  setDefaultPaymentMethod: async (_paymentMethodId: string): Promise<Wallet> => {
    return walletApi.get();
  },
};
