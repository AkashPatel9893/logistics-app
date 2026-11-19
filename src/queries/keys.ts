import type { QuoteInput } from '@/lib/api/catalog';

export const queryKeys = {
  me: ['me'] as const,
  appRules: ['config', 'rules'] as const,
  vehicles: ['vehicles'] as const,
  offerBanners: ['offers', 'banners'] as const,
  coupons: ['offers', 'coupons'] as const,
  quote: (input: QuoteInput) => ['rides', 'quote', input] as const,
  placeSearch: (q: string) => ['places', 'search', q] as const,
  addresses: ['me', 'addresses'] as const,
  orders: ['orders'] as const,
  orderPages: ['orders', 'pages'] as const,
  order: (id: string) => ['orders', id] as const,
  orderInvoice: (id: string) => ['orders', id, 'invoice'] as const,
  sharedTracking: (token: string) => ['tracking', token] as const,
  roadRoute: (id: string) => ['road-route', id] as const,
  wallet: ['me', 'wallet'] as const,
  identity: ['me', 'identity'] as const,
  support: ['support'] as const,
};
