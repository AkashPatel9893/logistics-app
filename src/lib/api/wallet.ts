import { request } from './client';
import type { AddPaymentMethodInput, Wallet } from './models';

export const walletApi = {
  get: (signal?: AbortSignal) => request<Wallet>({ url: '/me/wallet', signal }),

  topUp: (amount: number) =>
    request<Wallet>({ method: 'POST', url: '/me/wallet/topups', data: { amount } }),

  addPaymentMethod: (input: AddPaymentMethodInput) =>
    request<Wallet>({ method: 'POST', url: '/me/payment-methods', data: input }),

  setDefaultPaymentMethod: (paymentMethodId: string) =>
    request<Wallet>({
      method: 'PUT',
      url: '/me/payment-methods/default',
      data: { paymentMethodId },
    }),
};
