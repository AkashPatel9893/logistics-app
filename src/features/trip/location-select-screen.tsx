import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { placesApi } from '@/lib/api/places';
import { distanceKm } from '@/lib/geo';
import { DURATION } from '@/lib/motion';
import { draftStops, useTripStore } from '@/stores/trip-store';

import { AddressSearchCard } from './components/address-search-card';
import { LocationListItem } from './components/location-list-item';
import {
  ensureLocationPermission,
  geocodeAddress,
  getCurrentPosition,
  reverseGeocodePlace,
} from './geocoding';
import {
  updateLocalRecentFavorite,
  useAddressSearch,
  type DisplayAddress,
} from './hooks/use-address-search';
import { mapPickerHref } from './map-picker-route';
import { alertNotServiceable, isServiceable } from './serviceability';
import { goBack } from '@/lib/go-back';

const SAME_PLACE_AS_PICKUP_KM = 0.1;

export function LocationSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target, stop } = useLocalSearchParams<{ target?: string; stop?: string }>();
  const isPickupMode = target === 'pickup';
  /** Editing one stop of a multi-stop trip (opened from Add Stops). */
  const stopIndex = stop !== undefined ? Number(stop) : undefined;
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();
  const swapPickupAndDrop = useTripStore.use.swapPickupAndDrop();

  const currentLabel =
    stopIndex !== undefined
      ? (draftStops(draft)[stopIndex]?.label ?? '')
      : isPickupMode
        ? draft.pickupLabel
        : draft.dropLabel;
  const [query, setQuery] = useState(currentLabel);
  const [isResolving, setIsResolving] = useState(false);
  const [isSavedOnly, setIsSavedOnly] = useState(false);
  const [isCurrentLocationUnserved, setIsCurrentLocationUnserved] = useState(false);

  const search = useAddressSearch(query, isSavedOnly, draft.pickupRegion);
  const { data: addresses = [] } = useSavedAddresses();
  const saveAddress = useSaveAddress();
  const toggleFavorite = useToggleFavoriteAddress();
  const resultsLayout = useLayoutTransition();

  // Like other delivery apps, a booking starts from where the customer is. Replaces an empty or
  // left-over pickup, never one chosen for this booking; outside our area the last pickup stays.
  useEffect(() => {
    const isPickupChosen = () => {
      const { pickupRegion, isPickupCarriedOver } = useTripStore.getState().draft;
      return Boolean(pickupRegion) && !isPickupCarriedOver;
    };
    if (isPickupChosen()) return;
    let cancelled = false;
    (async () => {
      const permission = await ensureLocationPermission(true).catch(() => 'denied' as const);
      if (cancelled || permission !== 'granted') return;
      const position = await getCurrentPosition();
      if (cancelled || !position) return;
      if (!(await isServiceable(position))) {
        // Don't start a booking that cannot be priced.
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
  }, []);

  const pickupContactName = draft.pickupDetails?.contactName || user?.name || '';
  const pickupContactPhone = draft.pickupDetails?.contactPhone || user?.phone || '';

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
      // Local optimistic state is already preserved in MMKV
    }
  };

  const handleSelect = async (item: DisplayAddress) => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      const found =
        item.location ??
        (item.id.startsWith('place:') ? await placesApi.getPlaceLocation(item.id) : null) ??
        (await geocodeAddress(item.address || item.name));
      if (found && !(await isServiceable(found))) {
        alertNotServiceable(stopIndex !== undefined ? 'stop' : isPickupMode ? 'pickup' : 'drop');
        return;
      }
      const region = found;
      if (!region) {
        Alert.alert(
          'Location not found',
          `We couldn't find "${item.name}" on the map. Try a nearby landmark or pick it on the map.`,
        );
        return;
      }
      setQuery(item.name);

      // Not saved to recents here: a place is remembered only once a booking with it is placed.

      const trip = useTripStore.getState();
      if (stopIndex !== undefined) {
        trip.setStopLocation(stopIndex, item.name, region, item.address);
        if (item.contactName && item.contactPhone) {
          trip.setStopDetails(stopIndex, {
            contactName: item.contactName,
            contactPhone: item.contactPhone,
            houseNumber: '',
          });
        }
      } else if (isPickupMode) {
        trip.setPickup(item.name, region, item.address);
        if (item.contactName && item.contactPhone) {
          trip.setPickupDetails({
            contactName: item.contactName,
            contactPhone: item.contactPhone,
            houseNumber: '',
          });
        }
      } else {
        trip.setDrop(item.name, region, item.address);
        if (item.contactName && item.contactPhone) {
          trip.setDropDetails({
            contactName: item.contactName,
            contactPhone: item.contactPhone,
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
          stopIndex,
        }),
      );
    } catch (error) {
      Alert.alert('Could not select address', getErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const { trimmedQuery, isSearching, showNoResults, isLoading } = search;
  // Suggesting the pickup itself as a drop only leads to a 0 km booking. A typed search still finds it.
  const results =
    isPickupMode || trimmedQuery || !draft.pickupRegion
      ? search.results
      : search.results.filter(
          (item) =>
            !item.location ||
            !draft.pickupRegion ||
            distanceKm(draft.pickupRegion, item.location) > SAME_PLACE_AS_PICKUP_KM,
        );

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />

      {/* Top Bar with clean Back Button matching reference */}
      <AppView
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="px-4 pb-2 flex-row items-center bg-grouped"
      >
        <AppPressable
          onPress={() => goBack(router)}
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
        stopNumber={stopIndex !== undefined ? stopIndex + 1 : undefined}
        dropPlaceholder={
          stopIndex !== undefined
            ? stopIndex === draftStops(draft).length - 1
              ? 'Where is your Final Destination?'
              : `Where is your Stop ${stopIndex + 1}?`
            : undefined
        }
        // One stop at a time when already inside the multi-stop list.
        onAddStop={stopIndex === undefined ? () => router.push('/add-stops') : undefined}
        onToggleSavedAddresses={() => setIsSavedOnly((prev) => !prev)}
        isSavedAddressesActive={isSavedOnly}
        // Needs both ends chosen; not offered while picking the pickup or editing one stop.
        onSwap={
          stopIndex === undefined && !isPickupMode && draft.pickupLabel && draft.dropLabel
            ? () => {
                const oldPickup = draft.pickupLabel;
                swapPickupAndDrop();
                setQuery(oldPickup);
              }
            : undefined
        }
      />

      <AppScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {isCurrentLocationUnserved && (!draft.pickupRegion || draft.isPickupCarriedOver) ? (
          <AppView className="mx-4 mb-3 rounded-2xl bg-brand-tint p-4">
            <AppText className="text-[14px] font-bold text-foreground">
              We don&apos;t deliver at your current location yet
            </AppText>
            <AppText className="mt-1 text-[13px] text-muted">
              {draft.pickupRegion
                ? 'We kept your last pickup. Tap it above to change it.'
                : 'Tap the pickup above and choose a place in a city we serve.'}
            </AppText>
          </AppView>
        ) : null}

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
                distanceKm={
                  !isPickupMode && draft.pickupRegion && item.location
                    ? distanceKm(draft.pickupRegion, item.location)
                    : null
                }
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
