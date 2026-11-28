import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import type { CreateOrderInput, Order } from '@/lib/api/models';
import { ordersApi } from '@/lib/api/orders';

import { queryKeys } from './keys';

const ACTIVE_STATUSES = new Set<Order['status']>([
  'searching',
  'heading_to_pickup',
  'arrived_at_pickup',
  'pickup_complete',
  'arrived_at_drop',
  'awaiting_payment',
  'unknown',
]);

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_STATUSES.has(order.status);
}

/*
 * Polling rules: a query polls only while its screen is in front (`subscribed` follows screen
 * focus, and React Query already pauses while the app is in the background). Coming back to the
 * screen refetches stale data once. Pull to refresh fetches on demand.
 */
/** Order lists: only while an order is still running. */
const ORDER_LIST_POLL_MS = 30_000;
/** One order while searching: no trip socket yet, and "driver found" should show quickly. */
const ORDER_SEARCHING_POLL_MS = 5_000;
/** One order with a trip: the trip socket pushes driver position and status, so this is a backup. */
const ORDER_ON_TRIP_POLL_MS = 20_000;
/** Shared tracking link: no socket, the viewer only watches the map. */
const SHARED_TRACKING_POLL_MS = 15_000;

function orderPollMs(order: Order | undefined): number | false {
  if (!order || !isActiveOrder(order)) return false;
  return order.tripId ? ORDER_ON_TRIP_POLL_MS : ORDER_SEARCHING_POLL_MS;
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => ordersApi.list(signal),
    subscribed: useIsFocused(),
    refetchInterval: (query) =>
      query.state.data?.some(isActiveOrder) ? ORDER_LIST_POLL_MS : false,
  });
}

export function useOrderHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.orderPages,
    queryFn: ({ pageParam, signal }) => ordersApi.listPage(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    subscribed: useIsFocused(),
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) => page.items.some(isActiveOrder))
        ? ORDER_LIST_POLL_MS
        : false,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: ({ signal }) => ordersApi.get(id!, signal),
    enabled: Boolean(id),
    subscribed: useIsFocused(),
    refetchInterval: (query) => orderPollMs(query.state.data),
  });
}

function useCacheOrder() {
  const queryClient = useQueryClient();
  return (order: Order) => {
    queryClient.setQueryData(queryKeys.order(order.id), order);
    queryClient.setQueryData<Order[]>(queryKeys.orders, (list) =>
      list ? [order, ...list.filter((o) => o.id !== order.id)] : list,
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.orders });
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
  return useMutation({ mutationFn: ordersApi.cancel, onSuccess: cacheOrder });
}

export function useRateOrder() {
  const cacheOrder = useCacheOrder();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => ordersApi.rate(id, rating),
    onSuccess: cacheOrder,
  });
}

export function useOpenInvoicePdf() {
  return useMutation({ mutationFn: (id: string) => ordersApi.openInvoicePdf(id) });
}

export function useAddTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.addTip,
    // The order carries the new tip total and how much more can be added.
    onSettled: (_data, _error, { id }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) }),
  });
}

export function useShareTracking() {
  return useMutation({
    mutationFn: (input: { id: string; stopId?: string }) => ordersApi.share(input),
  });
}

export function useSharedTracking(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sharedTracking(token ?? ''),
    queryFn: ({ signal }) => ordersApi.getSharedTracking(token!, signal),
    enabled: Boolean(token),
    subscribed: useIsFocused(),
    refetchInterval: (query) =>
      query.state.data &&
      query.state.data.status !== 'delivered' &&
      query.state.data.status !== 'cancelled'
        ? SHARED_TRACKING_POLL_MS
        : false,
  });
}

export function useOrderInvoice(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.orderInvoice(id),
    queryFn: ({ signal }) => ordersApi.invoice(id, signal),
    enabled,
    retry: false,
  });
}

export function useGoodsClaim(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.goodsClaim(orderId),
    queryFn: ({ signal }) => ordersApi.getGoodsClaim(orderId, signal),
    enabled,
  });
}

export function useFileGoodsClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.fileGoodsClaim,
    onSuccess: (claim, input) =>
      queryClient.setQueryData(queryKeys.goodsClaim(input.orderId), claim),
  });
}
