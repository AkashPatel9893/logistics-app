import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { Alert } from '@/lib/native';
import { useRouter } from '@/lib/navigation';
import { useSavedAddresses } from '@/queries';
import { useTripStore } from '@/stores';

import {
  getCurrentPosition,
  getLastKnownPosition,
  resolvePlaceCoordinates,
  reverseGeocodePlace,
} from '../geocoding';
import { requestLocationAccess } from '../location-access';
import { mapPickerHref } from '../map-picker-route';
import type { DisplayAddress } from '../recent-addresses';
import { alertNotServiceable, isServiceable } from '../serviceability';

interface UsePlaceSelectionOptions {
  isPickupMode: boolean;
  returnTo?: 'home' | 'add-stops';
  stopIndex?: number;
  onSelectQuery: (name: string) => void;
}

export function usePlaceSelection({
  isPickupMode,
  returnTo,
  stopIndex,
  onSelectQuery,
}: UsePlaceSelectionOptions) {
  const router = useRouter();
  const { data: addresses = [] } = useSavedAddresses();
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const openPickupOnMap = () => {
    const { pickupLabel, pickupRegion } = useTripStore.getState().draft;
    const saved = addresses.find((a) => a.name === pickupLabel);
    router.push(
      mapPickerHref({
        mode: 'confirm',
        kind: 'pickup',
        addressId: saved?.id,
        region: pickupRegion,
        returnTo,
      }),
    );
  };

  const openDropOnMap = () => {
    router.push(mapPickerHref({ mode: 'pin', stopIndex }));
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
      const region = await resolvePlaceCoordinates(item);
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

      onSelectQuery(item.name);
      applySelectionToDraft(item, region);

      router.push(
        mapPickerHref({
          mode: 'confirm',
          kind: isPickupMode ? 'pickup' : 'drop',
          addressId: item.isSaved ? item.id : undefined,
          region,
          stopIndex,
          returnTo,
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

  return {
    isResolving,
    isLocating,
    handleSelect,
    useCurrentLocation,
    openPickupOnMap,
    openDropOnMap,
  };
}
