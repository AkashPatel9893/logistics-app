import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

/** Messages on one ticket, checked every 10 s while the screen is open. */
export function useTicketMessages(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.supportTicketMessages(id ?? ''),
    queryFn: ({ signal }) => contentApi.getTicketMessages(id!, signal),
    enabled: Boolean(id),
    refetchInterval: 10_000,
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
