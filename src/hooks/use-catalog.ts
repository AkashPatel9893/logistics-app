import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { catalogApi, type QuoteInput } from '@/lib/api/catalog';
import { queryKeys } from '@/lib/queries/keys';

const STATIC_CONTENT_STALE_MS = 1000 * 60 * 60;

export function useVehicleCatalog() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: ({ signal }) => catalogApi.getVehicles(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
}

export function useOfferBanners() {
  return useQuery({
    queryKey: queryKeys.offerBanners,
    queryFn: ({ signal }) => catalogApi.getOfferBanners(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
}

/** Server-priced ride options for a trip; keeps the last prices while re-quoting. */
export function useRideQuote(input: QuoteInput) {
  return useQuery({
    queryKey: queryKeys.quote(input),
    queryFn: ({ signal }) => catalogApi.getQuote(input, signal),
    placeholderData: keepPreviousData,
  });
}

export function useValidateCoupon() {
  return useMutation({ mutationFn: (code: string) => catalogApi.validateCoupon(code) });
}
