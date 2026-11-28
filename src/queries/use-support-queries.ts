import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { contentApi } from '@/lib/api/content';
import type { SupportMessage } from '@/lib/api/models';

import { queryKeys } from './keys';

const STATIC_CONTENT_STALE_MS = 1000 * 60 * 60;

export function useSupportInfo() {
  return useQuery({
    queryKey: queryKeys.support,
    queryFn: ({ signal }) => contentApi.getSupport(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentApi.createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets }),
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: queryKeys.supportTickets,
    queryFn: ({ signal }) => contentApi.listTickets(signal),
  });
}

/** Support answers in minutes, not seconds: a slow check is enough. */
const TICKET_MESSAGES_POLL_MS = 30_000;

/** Messages on one ticket, checked while the ticket screen is in front. */
export function useTicketMessages(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.supportTicketMessages(id ?? ''),
    queryFn: ({ signal }) => contentApi.getTicketMessages(id!, signal),
    enabled: Boolean(id),
    subscribed: useIsFocused(),
    refetchInterval: TICKET_MESSAGES_POLL_MS,
  });
}

export function useReplyToTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => contentApi.replyToTicket({ id, body }),
    onSuccess: (message) => {
      queryClient.setQueryData<SupportMessage[]>(queryKeys.supportTicketMessages(id), (list) =>
        list && !list.some((m) => m.id === message.id) ? [...list, message] : list,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets, exact: true });
    },
  });
}
