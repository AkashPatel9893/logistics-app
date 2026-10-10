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
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSaveAddress, useSavedAddresses, useToggleFavoriteAddress } from '@/hooks/use-addresses';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

import { AddressSearchCard } from './components/address-search-card';
import { LocationListItem } from './components/location-list-item';
import { geocodeAddress } from './geocoding';
import {
  saveLocalRecentAddress,
  updateLocalRecentFavorite,
  useAddressSearch,
  type DisplayAddress,
} from './hooks/use-address-search';
import { mapPickerHref } from './map-picker-route';

export function LocationSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target } = useLocalSearchParams<{ target?: string }>();
  const isPickupMode = target === 'pickup';
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();

  const currentLabel = isPickupMode ? draft.pickupLabel : draft.dropLabel;
  const [query, setQuery] = useState(currentLabel);
  const [isResolving, setIsResolving] = useState(false);
  const [isSavedOnly, setIsSavedOnly] = useState(false);

  const search = useAddressSearch(query, isSavedOnly);
  const { data: addresses = [] } = useSavedAddresses();
  const saveAddress = useSaveAddress();
  const toggleFavorite = useToggleFavoriteAddress();
  const resultsLayout = useLayoutTransition();

  const pickupContactName = draft.pickupDetails?.contactName || user?.name || 'Kushal Murthy';
  const pickupContactPhone = draft.pickupDetails?.contactPhone || user?.phone || '9164055551';

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

  const openDropOnMap = () => {
    router.push(mapPickerHref({ mode: 'pin' }));
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
      // Local optimistic state is already preserved in MMKV
    }
  };

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

      // Save to recent addresses
      saveLocalRecentAddress({
        ...item,
        location: region,
      });

      const trip = useTripStore.getState();
      if (isPickupMode) {
        trip.setPickup(item.name, region);
        if (item.contactName) {
          trip.setPickupDetails({
            contactName: item.contactName,
            contactPhone: item.contactPhone || '9164055551',
            houseNumber: '',
          });
        }
      } else {
        trip.setDrop(item.name, region);
        if (item.contactName) {
          trip.setDropDetails({
            contactName: item.contactName,
            contactPhone: item.contactPhone || '9164055551',
            houseNumber: '',
          });
        }
      }

      router.push(
        mapPickerHref({
          mode: 'confirm',
          kind: isPickupMode ? 'pickup' : 'drop',
          addressId: item.isSaved ? item.id : undefined,
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

      {/* Top Bar with clean Back Button matching reference */}
      <AppView
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="px-4 pb-2 flex-row items-center bg-grouped"
      >
        <AppPressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
          className="size-10 items-center justify-center rounded-full bg-surface shadow-xs border border-border/30"
        >
          <Icon name="chevron.left" size={20} tone="foreground" />
        </AppPressable>
      </AppView>

      {/* Fixed Pickup & Drop Cards with Select on map / Saved Addresses action strip */}
      <AddressSearchCard
        isPickupMode={isPickupMode}
        pickupLabel={draft.pickupLabel}
        pickupContactName={pickupContactName}
        pickupContactPhone={pickupContactPhone}
        onPickupPress={openPickupOnMap}
        dropLabel={draft.dropLabel}
        onDropPress={openDropOnMap}
        query={query}
        onChangeQuery={setQuery}
        onSubmit={() => results[0] && handleSelect(results[0])}
        isSearching={isSearching || isResolving}
        onSelectOnMap={openDropOnMap}
        onToggleSavedAddresses={() => setIsSavedOnly((prev) => !prev)}
        isSavedAddressesActive={isSavedOnly}
      />

      <AppScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Address List Container */}
        <AnimatedView
          layout={resultsLayout}
          className="mx-4 overflow-hidden rounded-2xl bg-surface border border-border/40 shadow-xs"
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
                onToggleFavorite={handleToggleFavorite}
              />
              {index < results.length - 1 ? <Divider insetClassName="ml-[64px]" /> : null}
            </AnimatedView>
          ))}

          {showNoResults ? (
            <AppText className="p-5 text-[13px] text-subtle text-center">
              No matching address found for &quot;{trimmedQuery}&quot;.
            </AppText>
          ) : null}

          {!isLoading && results.length === 0 ? (
            <AppText className="p-5 text-[13px] text-subtle text-center">
              {isSavedOnly
                ? 'No saved addresses found. Tap the heart on any address to save it.'
                : 'Search for an address, or pick one on the map.'}
            </AppText>
          ) : null}
        </AnimatedView>
      </AppScrollView>
    </AppView>
  );
}
