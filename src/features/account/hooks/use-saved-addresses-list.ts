import { getErrorMessage } from '@/lib/api/api-error';
import type { SavedAddress } from '@/lib/api/models';
import { Alert } from '@/lib/native';
import { useDeleteAddress, useSavedAddresses, useToggleFavoriteAddress } from '@/queries';

export function useSavedAddressesList() {
  const addressesQuery = useSavedAddresses();
  const toggleFavorite = useToggleFavoriteAddress();
  const deleteAddress = useDeleteAddress();

  const addresses = (addressesQuery.data ?? []).filter((a) => a.label !== 'recent');

  const handleToggleFavorite = (address: SavedAddress) => {
    toggleFavorite.mutate(
      { id: address.id, isFavorite: !address.isFavorite },
      {
        onError: (error) => Alert.alert('Could not update favourite', getErrorMessage(error)),
      },
    );
  };

  const confirmDelete = (address: SavedAddress) => {
    Alert.alert('Delete this address?', `${address.name} will be removed from your saved places.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAddress.mutate(address.id, {
            onError: (error) => Alert.alert('Could not delete', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return {
    addresses,
    isPending: addressesQuery.isPending,
    isError: addressesQuery.isError,
    errorMessage: addressesQuery.isError ? getErrorMessage(addressesQuery.error) : null,
    refetch: addressesQuery.refetch,
    toggleFavorite: handleToggleFavorite,
    confirmDelete,
  };
}
