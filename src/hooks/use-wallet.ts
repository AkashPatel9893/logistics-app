import { useQuery } from '@tanstack/react-query';

import { walletApi } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/queries/keys';

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: ({ signal }) => walletApi.get(signal),
  });
}
