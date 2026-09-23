import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AddPaymentMethodInput, PaymentMethod, Wallet } from '@/lib/api/models';
import { walletApi } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/queries/keys';

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: ({ signal }) => walletApi.get(signal),
  });
}

/** The payment method used for new bookings (the wallet's default). */
export function useDefaultPaymentMethod(): PaymentMethod | undefined {
  const { data } = useWallet();
  return (
    data?.paymentMethods.find((m) => m.id === data.defaultPaymentMethodId) ??
    data?.paymentMethods[0]
  );
}

function useWalletMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Wallet>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (wallet) => queryClient.setQueryData(queryKeys.wallet, wallet),
  });
}

export function useTopUpWallet() {
  return useWalletMutation((amount: number) => walletApi.topUp(amount));
}

export function useAddPaymentMethod() {
  return useWalletMutation((input: AddPaymentMethodInput) => walletApi.addPaymentMethod(input));
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.setDefaultPaymentMethod(id),
    // Optimistic: selection moves immediately.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallet });
      const previous = queryClient.getQueryData<Wallet>(queryKeys.wallet);
      if (previous)
        queryClient.setQueryData(queryKeys.wallet, { ...previous, defaultPaymentMethodId: id });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.wallet, context.previous);
    },
    onSuccess: (wallet) => queryClient.setQueryData(queryKeys.wallet, wallet),
  });
}
