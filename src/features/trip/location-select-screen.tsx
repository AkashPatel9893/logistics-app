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
import {
  SearchEmptyState,
  SearchQuickActions,
  type QuickAction,
} from './components/search-quick-actions';
import { LocationListItem } from './components/location-list-item';
import {
  geocodeAddress,
  getCurrentPosition,
  getLastKnownPosition,
  reverseGeocodePlace,
} from './geocoding';
import {
  updateLocalRecentFavorite,
  useAddressSearch,
  type DisplayAddress,
} from './hooks/use-address-search';
import { requestLocationAccess } from './location-access';
import { mapPickerHref } from './map-picker-route';
import { placeLine } from './place-line';
import { alertNotServiceable, isServiceable } from './serviceability';
import { goBack } from '@/lib/go-back';

const SAME_PLACE_AS_PICKUP_KM = 0.1;

export function LocationSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target, stop, from } = useLocalSearchParams<{
    target?: string;
    stop?: string;
    from?: string;
  }>();
  const isPickupMode = target === 'pickup';
  /** Opened from Home's "Pick up from" card: only the pickup is chosen here, then back home. */
  const isFromHome = isPickupMode && from === 'home';
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
  // Choosing a new pickup starts from an empty search, like Porter; a stop being edited keeps its name.
  const [query, setQuery] = useState(isPickupMode ? '' : currentLabel);
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
    // Choosing the pickup by hand: never swap in the current location behind the customer's back.
    if (isPickupMode || isPickupChosen()) return;
    let cancelled = false;
    (async () => {
      // Starting a booking: the pickup defaults to where the customer is, so ask now.
      const access = await requestLocationAccess();
      if (cancelled || access !== 'granted') return;
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
  }, [isPickupMode]);

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
      // A saved place's name is a nickname ("Office"); the driver needs its street address.
      const street = item.isSaved ? item.street : undefined;
      if (stopIndex !== undefined) {
        trip.setStopLocation(stopIndex, item.name, region, item.address, street);
        if (item.contactName && item.contactPhone) {
          trip.setStopDetails(stopIndex, {
            contactName: item.contactName,
            contactPhone: item.contactPhone,
            houseNumber: '',
          });
        }
      } else if (isPickupMode) {
        trip.setPickup(item.name, region, item.address, street);
        if (item.contactName && item.contactPhone) {
          trip.setPickupDetails({
            contactName: item.contactName,
            contactPhone: item.contactPhone,
            houseNumber: '',
          });
        }
      } else {
        trip.setDrop(item.name, region, item.address, street);
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
          returnHome: isFromHome,
        }),
      );
    } catch (error) {
      Alert.alert('Could not select address', getErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const { trimmedQuery, isSearching, showNoResults, isLoading } = search;

  const heading =
    stopIndex !== undefined
      ? { title: `Stop ${stopIndex + 1}`, subtitle: 'Where should this delivery go?' }
      : isPickupMode
        ? { title: 'Pickup location', subtitle: 'Where should the driver collect from?' }
        : { title: 'Drop location', subtitle: 'Where should it be delivered?' };

  // "Use current location": find the phone, then confirm that spot on the map like a search pick.
  const [isLocating, setIsLocating] = useState(false);
  const useCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const access = await requestLocationAccess({ explain: true });
      if (access !== 'granted') return;
      // The last known fix is instant; the map step after this lets the customer fine-tune it.
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
    ...(stopIndex === undefined
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

      {/* Back button and a title saying which point is being chosen. */}
      <AppView
        style={{ paddingTop: Math.max(insets.top, 12) + 4 }}
        className="flex-row items-center bg-grouped px-4 pb-3"
      >
        <AppPressable
          onPress={() => goBack(router)}
          pressScale={0.92}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="size-11 items-center justify-center rounded-full border border-border/40 bg-surface shadow-xs"
        >
          <Icon name="chevron.left" size={20} tone="foreground" />
        </AppPressable>
        <AppView className="ml-3 flex-1">
          <AppText accessibilityRole="header" className="text-[19px] font-bold text-foreground">
            {heading.title}
          </AppText>
          <AppText numberOfLines={1} className="text-[13px] text-muted">
            {heading.subtitle}
          </AppText>
        </AppView>
      </AppView>

      {/* Fixed Pickup & Drop Cards with Select on map / Saved Addresses action strip */}
      <AddressSearchCard
        isPickupMode={isPickupMode}
        // Porter's pickup search shows only the pickup field.
        showDrop={!isPickupMode}
        pickupLabel={placeLine(draft.pickupLabel, draft.pickupAddress)}
        pickupContactName={pickupContactName}
        pickupContactPhone={pickupContactPhone}
        onPickupPress={openPickupOnMap}
        dropLabel={draft.dropLabel}
        onDropPress={openDropOnMap}
        query={query}
        onChangeQuery={setQuery}
        onSubmit={() => results[0] && handleSelect(results[0])}
        isSearching={isSearching || isResolving}
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
        {trimmedQuery ? null : <SearchQuickActions actions={quickActions} />}

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

        {!isLoading && results.length === 0 && !trimmedQuery && !isSavedOnly ? (
          <SearchEmptyState
            title={isPickupMode ? 'Find your pickup point' : 'Find where it goes'}
            hint="Search by area, street, landmark or building name."
          />
        ) : null}

        {/* Address List Container */}
        {isLoading || results.length > 0 || showNoResults || isSavedOnly ? (
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

            {!isLoading && results.length === 0 && isSavedOnly ? (
              <AppText className="p-5 text-center text-[13px] text-subtle">
                No saved addresses yet. Tap the heart on any address to save it.
              </AppText>
            ) : null}
          </AnimatedView>
        ) : null}
      </AppScrollView>
    </AppView>
  );
}
