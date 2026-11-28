import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { type ChatThread, ordersApi } from '@/lib/api/orders';

import { queryKeys } from './keys';

/** Driver replies show within this while the chat screen is in front. */
const CHAT_POLL_MS = 10_000;

/** Chat messages for one order, checked while the chat screen is in front and the chat is open. */
export function useOrderChat(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orderChat(orderId ?? ''),
    queryFn: ({ signal }) => ordersApi.getChat(orderId!, signal),
    enabled: Boolean(orderId),
    subscribed: useIsFocused(),
    refetchInterval: (query) => (query.state.data?.open === false ? false : CHAT_POLL_MS),
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
