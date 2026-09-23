import { request } from './client';
import type { CreateOrderInput, Order, SharedTracking, TrackingShare } from './models';

export const ordersApi = {
  create: (input: CreateOrderInput) =>
    request<Order>({ method: 'POST', url: '/orders', data: input }),

  list: (signal?: AbortSignal) => request<Order[]>({ url: '/orders', signal }),

  get: (id: string, signal?: AbortSignal) => request<Order>({ url: `/orders/${id}`, signal }),

  cancel: (id: string) => request<Order>({ method: 'POST', url: `/orders/${id}/cancel` }),

  rate: (id: string, rating: number) =>
    request<Order>({ method: 'POST', url: `/orders/${id}/rating`, data: { rating } }),

  share: (id: string) => request<TrackingShare>({ method: 'POST', url: `/orders/${id}/share` }),

  /** Public: no login needed, used by the receiver's shared link. */
  getSharedTracking: (token: string, signal?: AbortSignal) =>
    request<SharedTracking>({ url: `/tracking/${token}`, signal }),
};
