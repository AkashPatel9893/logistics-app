import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { catalogApi, type QuoteInput } from '@/lib/api/catalog';

import { queryKeys } from './keys';

const STATIC_CONTENT_STALE_MS = 1000 * 60 * 60;
const QUOTE_STALE_MS = 5 * 60_000;

export function useAppRules() {
  const query = useQuery({
    queryKey: queryKeys.appRules,
    queryFn: ({ signal }) => catalogApi.getRules(signal),
    staleTime: STATIC_CONTENT_STALE_MS,
  });
  return query.data ?? { maxOrderStops: 4, otpLength: 6 };
}

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

export function useRideQuote(input: QuoteInput) {
  return useQuery({
    queryKey: queryKeys.quote(input),
    queryFn: ({ signal }) => catalogApi.getQuote(input, signal),
    placeholderData: keepPreviousData,
    staleTime: QUOTE_STALE_MS,
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons,
    queryFn: ({ signal }) => catalogApi.listCoupons(signal),
  });
}

export function useValidateCoupon() {
  return useMutation({ mutationFn: (code: string) => catalogApi.validateCoupon(code) });
}
