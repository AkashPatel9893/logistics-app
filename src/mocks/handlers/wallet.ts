import type { AddPaymentMethodInput, PaymentMethod, Wallet } from '@/lib/api/models';

import { db, type WalletRecord } from '../db';
import { body, created, HttpError, ok, randomId, requireUser } from '../http';
import type { Route } from './types';

const CASH: PaymentMethod = {
  id: 'cash',
  type: 'cash',
  label: 'Cash',
  // Not "Default payment method": that goes stale once another method is the default.
  subtitle: 'Pay the driver directly',
};

export function walletFor(userId: string): WalletRecord {
  const existing = db.wallets.get(userId);
  if (existing) return existing;
  // A new account starts empty: balance and history come only from real top-ups.
  return db.wallets.set(userId, {
    balance: 0,
    paymentMethods: [CASH],
    defaultPaymentMethodId: CASH.id,
    transactions: [],
  });
}

function toWallet(record: WalletRecord): Wallet {
  // Wallets persisted before the Cash subtitle changed still carry the old copy.
  const paymentMethods = record.paymentMethods.map((method) =>
    method.id === CASH.id ? CASH : method,
  );
  return { ...record, paymentMethods };
}

function newMethod(input: AddPaymentMethodInput): PaymentMethod {
  switch (input.type) {
    case 'upi': {
      const upiId = input.upiId?.trim();
      if (!upiId) throw new HttpError(422, 'INVALID_UPI', 'Enter a UPI ID.');
      return { id: randomId('upi'), type: 'upi', label: upiId, subtitle: 'UPI' };
    }
    case 'card': {
      const digits = (input.cardNumber ?? '').replace(/\D/g, '');
      if (digits.length < 4) throw new HttpError(422, 'INVALID_CARD', 'Enter a valid card number.');
      return {
        id: randomId('card'),
        type: 'card',
        label: `Card •••• ${digits.slice(-4)}`,
        subtitle: 'Debit/Credit Card',
      };
    }
    case 'paytm':
      return {
        id: randomId('paytm'),
        type: 'paytm',
        label: 'Paytm Wallet',
        subtitle: 'Linked wallet',
      };
    default:
      throw new HttpError(422, 'INVALID_METHOD', 'Unsupported payment method.');
  }
}

export const walletRoutes: Route[] = [
  {
    method: 'GET',
    path: '/me/wallet',
    handler: (req) => ok(toWallet(walletFor(requireUser(req)))),
  },
  {
    method: 'POST',
    path: '/me/wallet/topups',
    handler: (req) => {
      const userId = requireUser(req);
      const amount = Number(body<{ amount: number }>(req).amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(422, 'INVALID_AMOUNT', 'Enter a valid amount.');
      }
      const wallet = walletFor(userId);
      const updated = db.wallets.set(userId, {
        ...wallet,
        balance: wallet.balance + amount,
        transactions: [
          {
            id: randomId('txn'),
            title: 'Wallet Top Up',
            createdAt: new Date().toISOString(),
            amount,
            kind: 'credit',
          },
          ...wallet.transactions,
        ],
      });
      return created(toWallet(updated), 'Wallet topped up');
    },
  },
  {
    method: 'POST',
    path: '/me/payment-methods',
    handler: (req) => {
      const userId = requireUser(req);
      const method = newMethod(body<AddPaymentMethodInput>(req));
      const wallet = walletFor(userId);
      const updated = db.wallets.set(userId, {
        ...wallet,
        paymentMethods: [...wallet.paymentMethods, method],
        defaultPaymentMethodId: method.id,
      });
      return created(toWallet(updated), 'Payment method added');
    },
  },
  {
    method: 'PUT',
    path: '/me/payment-methods/default',
    handler: (req) => {
      const userId = requireUser(req);
      const { paymentMethodId } = body<{ paymentMethodId: string }>(req);
      const wallet = walletFor(userId);
      if (!wallet.paymentMethods.some((m) => m.id === paymentMethodId)) {
        throw new HttpError(404, 'METHOD_NOT_FOUND', 'Payment method not found.');
      }
      return ok(
        toWallet(db.wallets.set(userId, { ...wallet, defaultPaymentMethodId: paymentMethodId })),
      );
    },
  },
];
