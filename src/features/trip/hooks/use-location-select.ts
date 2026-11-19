import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { placesApi } from '@/lib/api/places';
import { distanceKm } from '@/lib/geo';
import { Alert } from '@/lib/native';
import { useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useSaveAddress, useSavedAddresses, useToggleFavoriteAddress } from '@/queries';
import { draftStops, useAuthStore, useTripStore } from '@/stores';

import { type QuickAction } from '../components/search-quick-actions';
import {
  geocodeAddress,
  getCurrentPosition,
  getLastKnownPosition,
  reverseGeocodePlace,
} from '../geocoding';
import {
  updateLocalRecentFavorite,
  useAddressSearch,
  type DisplayAddress,
} from './use-address-search';
import { requestLocationAccess } from '../location-access';
import { mapPickerHref } from '../map-picker-route';
import { alertNotServiceable, isServiceable } from '../serviceability';

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
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSavedOnly, setIsSavedOnly] = useState(false);
  const [isCurrentLocationUnserved, setIsCurrentLocationUnserved] = useState(false);

  const search = useAddressSearch(query, isSavedOnly, draft.pickupRegion);
  const { data: addresses = [] } = useSavedAddresses();
  const saveAddress = useSaveAddress();
  const toggleFavorite = useToggleFavoriteAddress();

  useEffect(() => {
    const isPickupChosen = () => {
      const { pickupRegion, isPickupCarriedOver } = useTripStore.getState().draft;
      return Boolean(pickupRegion) && !isPickupCarriedOver;
    };
    if (isPickupMode || isPickupChosen()) return;

    let cancelled = false;
    (async () => {
      const access = await requestLocationAccess();
      if (cancelled || access !== 'granted') return;
      const position = await getCurrentPosition();
      if (cancelled || !position) return;
      if (!(await isServiceable(position))) {
        if (!cancelled) setIsCurrentLocationUnserved(true);
        return;
      }
      const place = await reverseGeocodePlace(position, 'Current location');
      if (cancelled || isPickupChosen()) return;
      useTripStore.getState().setPickup(place.label, position, place.address);
    })();
    return () => {
      cancelled = true;
    };
  }, [isPickupMode]);

  const openPickupOnMap = () => {
    const saved = addresses.find((a) => a.name === draft.pickupLabel);
    router.push(
      mapPickerHref({
        mode: 'confirm',
        kind: 'pickup',
        addressId: saved?.id,
        region: draft.pickupRegion,
        returnHome: isFromHome,
      }),
    );
  };

  const openDropOnMap = () => {
    router.push(mapPickerHref({ mode: 'pin', stopIndex }));
  };

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
    } catch {
      // Optimistic favorite state stays in local storage.
    }
  };

  const applySelectionToDraft = (
    item: DisplayAddress,
    region: NonNullable<DisplayAddress['location']>,
  ) => {
    const trip = useTripStore.getState();
    const street = item.isSaved ? item.street : undefined;
    const details =
      item.contactName && item.contactPhone
        ? { contactName: item.contactName, contactPhone: item.contactPhone, houseNumber: '' }
        : null;

    if (stopIndex !== undefined) {
      trip.setStopLocation(stopIndex, item.name, region, item.address, street);
      if (details) trip.setStopDetails(stopIndex, details);
      return;
    }
    if (isPickupMode) {
      trip.setPickup(item.name, region, item.address, street);
      if (details) trip.setPickupDetails(details);
      return;
    }
    trip.setDrop(item.name, region, item.address, street);
    if (details) trip.setDropDetails(details);
  };

  const handleSelect = async (item: DisplayAddress) => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      const region =
        item.location ??
        (item.id.startsWith('place:') ? await placesApi.getPlaceLocation(item.id) : null) ??
        (await geocodeAddress(item.address || item.name));

      if (region && !(await isServiceable(region))) {
        alertNotServiceable(stopIndex !== undefined ? 'stop' : isPickupMode ? 'pickup' : 'drop');
        return;
      }
      if (!region) {
        Alert.alert(
          'Location not found',
          `We couldn't find "${item.name}" on the map. Try a nearby landmark or pick it on the map.`,
        );
        return;
      }

      setQuery(item.name);
      applySelectionToDraft(item, region);

      router.push(
        mapPickerHref({
          mode: 'confirm',
          kind: isPickupMode ? 'pickup' : 'drop',
          addressId: item.isSaved ? item.id : undefined,
          region,
          stopIndex,
          returnHome: isFromHome,
        }),
      );
    } catch (error) {
      Alert.alert('Could not select address', getErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const useCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const access = await requestLocationAccess({ explain: true });
      if (access !== 'granted') return;
      const position = (await getLastKnownPosition()) ?? (await getCurrentPosition());
      if (!position) {
        Alert.alert('Location unavailable', 'Unable to get your current location.');
        return;
      }
      if (!(await isServiceable(position))) {
        alertNotServiceable(isPickupMode ? 'pickup' : 'drop');
        return;
      }
      const place = await reverseGeocodePlace(position, 'Current location');
      await handleSelect({
        id: 'current-location',
        name: place.label,
        address: place.address,
        iconType: 'search',
        isFavorite: false,
        location: position,
        isSaved: false,
        contactName: null,
      });
    } finally {
      setIsLocating(false);
    }
  };

  const quickActions: QuickAction[] = [
    ...(isPickupMode && stopIndex === undefined
      ? [
          {
            key: 'current',
            icon: 'location.north.fill' as const,
            title: 'Use current location',
            subtitle: 'Using your phone’s GPS',
            onPress: useCurrentLocation,
            isBusy: isLocating,
          },
        ]
      : []),
    {
      key: 'map',
      icon: 'mappin' as const,
      title: 'Select on map',
      subtitle: 'Move the map to the exact spot',
      onPress: isPickupMode ? openPickupOnMap : openDropOnMap,
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
    isResolving,
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
    openPickupOnMap,
    openDropOnMap,
    handleToggleFavorite,
    handleSelect,
    handleSwap,
    openAddStops: stopIndex === undefined ? () => router.push('/add-stops') : undefined,
  };
}
