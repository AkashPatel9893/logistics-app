import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateOrderInput, Order } from '@/lib/api/models';
import { ordersApi } from '@/lib/api/orders';
import { queryKeys } from '@/lib/queries/keys';

const ACTIVE_STATUSES = new Set<Order['status']>([
  'searching',
  'heading_to_pickup',
  'pickup_complete',
]);

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_STATUSES.has(order.status);
}

/** The user's orders; polls while any are in progress so statuses stay fresh. */
export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => ordersApi.list(signal),
    refetchInterval: (query) => (query.state.data?.some(isActiveOrder) ? 15_000 : false),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: ({ signal }) => ordersApi.get(id!, signal),
    enabled: Boolean(id),
  });
}

/** Stores an authoritative order in both the detail and list caches. */
function useCacheOrder() {
  const queryClient = useQueryClient();
  return (order: Order) => {
    queryClient.setQueryData(queryKeys.order(order.id), order);
    queryClient.setQueryData<Order[]>(queryKeys.orders, (list) =>
      list ? [order, ...list.filter((o) => o.id !== order.id)] : list,
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true });
  };
}

export function useCreateOrder() {
  const cacheOrder = useCacheOrder();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: cacheOrder,
  });
}

export function useCancelOrder() {
  const cacheOrder = useCacheOrder();
  return useMutation({ mutationFn: (id: string) => ordersApi.cancel(id), onSuccess: cacheOrder });
}

export function useRateOrder() {
  const cacheOrder = useCacheOrder();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => ordersApi.rate(id, rating),
    onSuccess: cacheOrder,
  });
}

export function useShareTracking() {
  return useMutation({ mutationFn: (orderId: string) => ordersApi.share(orderId) });
}

export function useSharedTracking(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sharedTracking(token ?? ''),
    queryFn: ({ signal }) => ordersApi.getSharedTracking(token!, signal),
    enabled: Boolean(token),
  });
}
