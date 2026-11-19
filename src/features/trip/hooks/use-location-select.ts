import { useState } from 'react';

import { distanceKm } from '@/lib/geo';
import { useLocalSearchParams, useRouter } from '@/lib/navigation';
import { draftStops, useAuthStore, useTripStore } from '@/stores';

import { type QuickAction } from '../components/search-quick-actions';
import { useAddressSearch } from './use-address-search';
import { useAutoFillCurrentPickup } from './use-auto-fill-current-pickup';
import { useFavoriteAddressToggle } from './use-favorite-address-toggle';
import { usePlaceSelection } from './use-place-selection';

const SAME_PLACE_AS_PICKUP_KM = 0.1;

function resolveHeading(isPickupMode: boolean, stopIndex?: number) {
  if (stopIndex !== undefined) {
    return { title: `Stop ${stopIndex + 1}`, subtitle: 'Where should this delivery go?' };
  }
  if (isPickupMode) {
    return { title: 'Pickup location', subtitle: 'Where should the driver collect from?' };
  }
  return { title: 'Drop location', subtitle: 'Where should it be delivered?' };
}

export function useLocationSelect() {
  const router = useRouter();
  const { target, stop, from } = useLocalSearchParams<{
    target?: string;
    stop?: string;
    from?: string;
  }>();
  const isPickupMode = target === 'pickup';
  const isFromHome = isPickupMode && from === 'home';
  const stopIndex = stop !== undefined ? Number(stop) : undefined;

  const draft = useTripStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const swapPickupAndDrop = useTripStore((s) => s.swapPickupAndDrop);

  const currentLabel =
    stopIndex !== undefined
      ? (draftStops(draft)[stopIndex]?.label ?? '')
      : isPickupMode
        ? draft.pickupLabel
        : draft.dropLabel;

  const [query, setQuery] = useState(isPickupMode ? '' : currentLabel);
  const [isSavedOnly, setIsSavedOnly] = useState(false);

  const isCurrentLocationUnserved = useAutoFillCurrentPickup(isPickupMode);
  const handleToggleFavorite = useFavoriteAddressToggle();
  const selection = usePlaceSelection({
    isPickupMode,
    isFromHome,
    stopIndex,
    onSelectQuery: setQuery,
  });
  const search = useAddressSearch(query, isSavedOnly, draft.pickupRegion);

  const quickActions: QuickAction[] = [
    ...(isPickupMode && stopIndex === undefined
      ? [
          {
            key: 'current',
            icon: 'location.north.fill' as const,
            title: 'Use current location',
            subtitle: 'Using your phone’s GPS',
            onPress: selection.useCurrentLocation,
            isBusy: selection.isLocating,
          },
        ]
      : []),
    {
      key: 'map',
      icon: 'mappin' as const,
      title: 'Select on map',
      subtitle: 'Move the map to the exact spot',
      onPress: isPickupMode ? selection.openPickupOnMap : selection.openDropOnMap,
    },
    ...(isPickupMode
      ? []
      : [
          {
            key: 'saved',
            icon: (isSavedOnly ? 'heart.fill' : 'heart') as 'heart' | 'heart.fill',
            title: 'Saved addresses',
            subtitle: isSavedOnly
              ? 'Showing saved places · tap to show all'
              : 'Home, shop and other places',
            onPress: () => setIsSavedOnly((prev) => !prev),
            isActive: isSavedOnly,
          },
        ]),
  ];

  const { trimmedQuery, isSearching, showNoResults, isLoading } = search;

  const results =
    isPickupMode || trimmedQuery || !draft.pickupRegion
      ? search.results
      : search.results.filter(
          (item) =>
            !item.location ||
            !draft.pickupRegion ||
            distanceKm(draft.pickupRegion, item.location) > SAME_PLACE_AS_PICKUP_KM,
        );

  const handleSwap =
    stopIndex === undefined && !isPickupMode && draft.pickupLabel && draft.dropLabel
      ? () => {
          const oldPickup = draft.pickupLabel;
          swapPickupAndDrop();
          setQuery(oldPickup);
        }
      : undefined;

  return {
    draft,
    isPickupMode,
    stopIndex,
    currentLabel,
    query,
    setQuery,
    isResolving: selection.isResolving,
    isSavedOnly,
    isCurrentLocationUnserved,
    trimmedQuery,
    isSearching,
    showNoResults,
    isLoading,
    results,
    quickActions,
    heading: resolveHeading(isPickupMode, stopIndex),
    pickupContactName: draft.pickupDetails?.contactName || user?.name || '',
    pickupContactPhone: draft.pickupDetails?.contactPhone || user?.phone || '',
    openPickupOnMap: selection.openPickupOnMap,
    openDropOnMap: selection.openDropOnMap,
    handleToggleFavorite,
    handleSelect: selection.handleSelect,
    handleSwap,
    openAddStops: stopIndex === undefined ? () => router.push('/add-stops') : undefined,
  };
}
