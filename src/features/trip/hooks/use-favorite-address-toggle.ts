import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { Alert } from '@/lib/native';
import { useDeleteAddress, useSaveAddress } from '@/queries';

import { resolvePlaceCoordinates } from '../geocoding';
import { updateLocalRecentFavorite, type DisplayAddress } from '../recent-addresses';

export function useFavoriteAddressToggle() {
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleToggleFavorite = async (item: DisplayAddress) => {
    if (busyId === item.id) return;
    setBusyId(item.id);
    try {
      if (item.isSaved && !item.id.startsWith('recent:')) {
        updateLocalRecentFavorite(item.id, false);
        try {
          await deleteAddress.mutateAsync(item.id);
        } catch (error) {
          updateLocalRecentFavorite(item.id, true);
          Alert.alert('Could not remove saved address', getErrorMessage(error));
        }
        return;
      }

      const location = item.location ?? (await resolvePlaceCoordinates(item));
      if (!location) {
        Alert.alert('Could not save address', 'We could not locate this place to save it.');
        return;
      }

      updateLocalRecentFavorite(item.id, true);
      try {
        const saved = await saveAddress.mutateAsync({
          name: item.name,
          address: item.address,
          location,
          isFavorite: true,
        });
        updateLocalRecentFavorite(saved.id, true);
      } catch (error) {
        updateLocalRecentFavorite(item.id, false);
        Alert.alert('Could not save address', getErrorMessage(error));
      }
    } finally {
      setBusyId(null);
    }
  };

  return handleToggleFavorite;
}
