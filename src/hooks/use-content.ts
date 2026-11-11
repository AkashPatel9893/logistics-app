import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api/auth';
import { contentApi } from '@/lib/api/content';
import { queryKeys } from '@/lib/queries/keys';

const STATIC_CONTENT_STALE_MS = 1000 * 60 * 60;

export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages,
    queryFn: ({ signal }) => authApi.getLanguages(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
}

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

/** The account's email and whether it is verified. */
export function useIdentity() {
  return useQuery({
    queryKey: queryKeys.identity,
    queryFn: ({ signal }) => authApi.getIdentity(signal),
  });
}

export function useRequestEmailCode() {
  return useMutation({ mutationFn: authApi.requestEmailCode });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (identity) => queryClient.setQueryData(queryKeys.identity, identity),
  });
}
