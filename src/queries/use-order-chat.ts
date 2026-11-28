import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ChatThread, ordersApi } from '@/lib/api/orders';

import { queryKeys } from './keys';

/** Chat messages for one order, checked every 5 s while the chat screen is open. */
export function useOrderChat(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orderChat(orderId ?? ''),
    queryFn: ({ signal }) => ordersApi.getChat(orderId!, signal),
    enabled: Boolean(orderId),
    refetchInterval: (query) => (query.state.data?.open === false ? false : 5000),
  });
}

export function useSendChat(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => ordersApi.sendChat({ id: orderId, body }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatThread>(queryKeys.orderChat(orderId), (thread) =>
        thread && !thread.messages.some((m) => m.id === message.id)
          ? { ...thread, messages: [...thread.messages, message] }
          : thread,
      );
    },
  });
}
