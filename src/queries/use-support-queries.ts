import { useMutation, useQuery } from '@tanstack/react-query';

import { contentApi } from '@/lib/api/content';

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
  return useMutation({ mutationFn: contentApi.createTicket });
}
