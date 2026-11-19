import { useSaveAddress, useToggleFavoriteAddress } from '@/queries';

import { updateLocalRecentFavorite, type DisplayAddress } from '../recent-addresses';

export function useFavoriteAddressToggle() {
  const saveAddress = useSaveAddress();
  const toggleFavorite = useToggleFavoriteAddress();

  const handleToggleFavorite = async (item: DisplayAddress) => {
    const nextFavoriteState = !(item.isFavorite || item.isSaved);
    updateLocalRecentFavorite(item.id, nextFavoriteState);

    try {
      if (item.isSaved && !item.id.startsWith('recent:')) {
        toggleFavorite.mutate(item.id);
      } else {
        const saved = await saveAddress.mutateAsync({
          name: item.name,
          address: item.address,
          location: item.location,
        });
        updateLocalRecentFavorite(saved.id, true);
      }
    } catch {}
  };

  return handleToggleFavorite;
}
