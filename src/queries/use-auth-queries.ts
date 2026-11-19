import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/api/auth';
import type { UsageType } from '@/lib/api/models';
import { useAuthStore } from '@/stores/auth-store';

import { queryKeys } from './keys';

const STATIC_CONTENT_STALE_MS = 1000 * 60 * 60;

export function useProfileQuery() {
  const isOnboarded = useAuthStore((state) => state.user?.isOnboarded === true);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: isOnboarded,
  });
}

export function useSendOtp() {
  return useMutation({ mutationFn: (phone: string) => authApi.sendOtp(phone) });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) => authApi.verifyOtp(phone, otp),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; phone?: string; usageType?: UsageType }) =>
      authApi.updateProfile(input),
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(queryKeys.me, updated);
    },
  });
}

export function useUpdateProfileName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateName,
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(queryKeys.me, updated);
    },
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages,
    queryFn: ({ signal }) => authApi.getLanguages(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
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
