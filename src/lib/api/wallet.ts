import { request } from './client';
import type { Wallet, WalletTransaction } from './models';

export const walletApi = {
  get: async (signal?: AbortSignal): Promise<Wallet> => {
    const [res, txs] = await Promise.all([
      request<any>({ url: '/wallet', signal }),
      request<any[]>({ url: '/wallet/transactions', signal }),
    ]);
    const transactions: WalletTransaction[] = (txs ?? []).map((t: any) => ({
      id: t.id,
      title: t.title ?? t.kind,
      amount: Number(t.amount),
      createdAt: t.created_at,
      kind: Number(t.amount) >= 0 ? ('credit' as const) : ('debit' as const),
    }));
    return { balance: Number(res.balance ?? 0), transactions };
  },
};
