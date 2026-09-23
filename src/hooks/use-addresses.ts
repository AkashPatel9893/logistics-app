import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { GeoPoint, SavedAddress } from '@/lib/api/models';
import { placesApi, type SaveAddressInput } from '@/lib/api/places';
import { queryKeys } from '@/lib/queries/keys';

export function useSavedAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: ({ signal }) => placesApi.listAddresses(signal),
  });
}

/** Writes an updated address into the cached list, then refreshes it. */
function useAddressMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<SavedAddress>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (address) => {
      queryClient.setQueryData<SavedAddress[]>(queryKeys.addresses, (list) =>
        list ? [address, ...list.filter((a) => a.id !== address.id)] : [address],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });
}

export function useSaveAddress() {
  return useAddressMutation((input: SaveAddressInput) => placesApi.saveAddress(input));
}

export function useUpdateAddress() {
  return useAddressMutation(
    ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      address?: string;
      location?: GeoPoint | null;
    }) => placesApi.updateAddress(id, input),
  );
}

export function useSaveAddressContact() {
  return useAddressMutation(
    ({ id, ...contact }: { id: string; name: string; phone: string; houseNumber: string }) =>
      placesApi.saveContact(id, contact),
  );
}

export function useToggleFavoriteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => placesApi.toggleFavorite(id),
    // Optimistic: the heart flips immediately; rolled back if the request fails.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses });
      const previous = queryClient.getQueryData<SavedAddress[]>(queryKeys.addresses);
      queryClient.setQueryData<SavedAddress[]>(queryKeys.addresses, (list) =>
        list?.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.addresses, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function usePlaceSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: queryKeys.placeSearch(q),
    queryFn: ({ signal }) => placesApi.search(q, signal),
    enabled: q.length > 0,
    staleTime: 1000 * 60 * 10,
  });
}
