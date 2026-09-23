import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Divider,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import { useSaveAddress, useSavedAddresses, useToggleFavoriteAddress } from '@/hooks/use-addresses';
import { getErrorMessage } from '@/lib/api/api-error';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { DURATION } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { AddressSearchCard } from './components/address-search-card';
import { LocationListItem } from './components/location-list-item';
import { geocodeAddress } from './geocoding';
import { useAddressSearch, type DisplayAddress } from './hooks/use-address-search';
import { mapPickerHref } from './map-picker-route';

export function LocationSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target } = useLocalSearchParams<{ target?: string }>();
  const isPickupMode = target === 'pickup';
  const draft = useTripStore.use.draft();
  const currentLabel = isPickupMode ? draft.pickupLabel : draft.dropLabel;
  const [query, setQuery] = useState(currentLabel);
  const [isResolving, setIsResolving] = useState(false);
  const search = useAddressSearch(query);
  const { data: addresses = [] } = useSavedAddresses();
  const saveAddress = useSaveAddress();
  const toggleFavorite = useToggleFavoriteAddress();
  const resultsLayout = useLayoutTransition();

  const openPickupOnMap = () => {
    const saved = addresses.find((a) => a.name === draft.pickupLabel);
    router.push(
      mapPickerHref({
        mode: 'confirm',
        kind: 'pickup',
        addressId: saved?.id,
        region: draft.pickupRegion,
      }),
    );
  };

  const handleEdit = (item: DisplayAddress) => {
    router.push(
      mapPickerHref({
        mode: 'edit',
        addressId: item.id,
        name: item.name,
        address: item.address,
        region: item.location,
      }),
    );
  };

  // Every pick is confirmed on the map, so there's a visual check of where
  // the place actually is before it's locked in.
  const handleSelect = async (item: DisplayAddress) => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      const region = item.location ?? (await geocodeAddress(item.address || item.name));
      if (!region) {
        Alert.alert(
          'Location not found',
          `We couldn't find "${item.name}" on the map. Try a nearby landmark or pick it on the map.`,
        );
        return;
      }
      setQuery(item.name);

      const saved = await saveAddress.mutateAsync({
        name: item.name,
        address: item.address,
        location: region,
      });
      const trip = useTripStore.getState();
      if (isPickupMode) trip.setPickup(item.name, region);
      else trip.setDrop(item.name, region);

      router.push(
        mapPickerHref({
          mode: 'confirm',
          kind: isPickupMode ? 'pickup' : 'drop',
          addressId: saved.id,
          region,
        }),
      );
    } catch (error) {
      Alert.alert('Could not select address', getErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const { results, trimmedQuery, isSearching, showNoResults, isLoading } = search;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader
        title={isPickupMode ? 'Select pickup address' : 'Select drop address'}
        onBack={() => router.back()}
      />

      <AppScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <AddressSearchCard
          isPickupMode={isPickupMode}
          pickupLabel={draft.pickupLabel}
          onPickupPress={openPickupOnMap}
          query={query}
          onChangeQuery={setQuery}
          onSubmit={() => results[0] && handleSelect(results[0])}
          isSearching={isSearching || isResolving}
        />

        {!isPickupMode ? (
          <AppView className="mx-4 mb-5 flex-row gap-3">
            <AppPressable
              onPress={() => router.push(mapPickerHref({ mode: 'pin' }))}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-3"
            >
              <Icon name="location" size={15} tone="brand" />
              <AppText className="text-[13px] font-semibold text-foreground-emphasis">
                Select from map
              </AppText>
            </AppPressable>
          </AppView>
        ) : null}

        <AppView className="mx-4 mb-3">
          <AppText className="text-[11px] font-bold uppercase tracking-widest text-subtle">
            {trimmedQuery ? 'Search results' : 'Recent & Saved Locations'}
          </AppText>
        </AppView>

        <AnimatedView
          layout={resultsLayout}
          className="mx-4 overflow-hidden rounded-2xl bg-surface"
        >
          {isLoading ? (
            <AppView className="p-6">
              <AppSpinner tone="brand" />
            </AppView>
          ) : null}

          {results.map((item, index) => (
            <AnimatedView key={item.id} entering={FadeIn.duration(DURATION.small)}>
              <LocationListItem
                item={item}
                isSelected={currentLabel === item.name}
                onPress={handleSelect}
                onEdit={handleEdit}
                onToggleFavorite={(id) => toggleFavorite.mutate(id)}
              />
              {index < results.length - 1 ? <Divider insetClassName="ml-[68px]" /> : null}
            </AnimatedView>
          ))}

          {showNoResults ? (
            <AppText className="p-4 text-[13px] text-subtle">
              No matching address found for &quot;{trimmedQuery}&quot;.
            </AppText>
          ) : null}
          {!isLoading && !trimmedQuery && results.length === 0 ? (
            <AppText className="p-4 text-[13px] text-subtle">
              Search for an address, or pick one on the map.
            </AppText>
          ) : null}
        </AnimatedView>
      </AppScrollView>
    </AppView>
  );
}
