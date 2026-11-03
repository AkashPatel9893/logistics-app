import { useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';

import { AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';
import { usePlaceSearch } from '@/hooks/use-addresses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { placesApi } from '@/lib/api/places';
import type { GeoPoint } from '@/lib/geo';

import { geocodeAddress } from '../geocoding';
import { useDebouncedValue } from '../hooks/use-address-search';

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;
const MAX_RESULTS = 5;
// Leaves room for the floating back button on the left.
const BACK_BUTTON_OFFSET = 68;
const BAR_HEIGHT = 44;

export interface MapSearchBarProps {
  topInset: number;
  /** Map center, so suggestions are biased toward the area being looked at. */
  near: GeoPoint;
  onSelect: (point: GeoPoint, place: { label: string; address: string }) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

/** Search box floating over the map: picking a result moves the pin there. */
export function MapSearchBar({ topInset, near, onSelect, onFocusChange }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const placeholderColor = useThemeColor('icon-subtle');

  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const places = usePlaceSearch(debouncedQuery, near);
  const results = (places.data ?? []).slice(0, MAX_RESULTS);
  const isOpen = query.trim().length >= MIN_QUERY_LENGTH;
  const isSearching = isOpen && (query.trim() !== debouncedQuery || places.isFetching);

  const handlePick = async (place: NonNullable<typeof places.data>[number]) => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      const point =
        place.location ??
        (place.id.startsWith('place:') ? await placesApi.getPlaceLocation(place.id) : null) ??
        (await geocodeAddress(place.address || place.name));
      if (!point) {
        Alert.alert(
          'Location not found',
          `We couldn't find "${place.name}" on the map. Try a nearby landmark.`,
        );
        return;
      }
      Keyboard.dismiss();
      setQuery('');
      onSelect(point, { label: place.name, address: place.address });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <AppView
        pointerEvents="box-none"
        style={{ top: topInset + 8, left: BACK_BUTTON_OFFSET, right: 16, height: BAR_HEIGHT }}
        className="absolute z-20 flex-row items-center rounded-full border border-black/5 bg-white px-4 shadow-md"
      >
        <Icon name="magnifyingglass" size={18} tone="subtle" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder="Search a place"
          placeholderTextColor={placeholderColor}
          accessibilityLabel="Search a place on the map"
          returnKeyType="search"
          autoCorrect={false}
          className="ml-2 flex-1 text-[15px] text-foreground"
        />
        {isSearching || isResolving ? (
          <AppSpinner tone="brand" />
        ) : query.length > 0 ? (
          <AppPressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
            <Icon name="xmark.circle.fill" size={18} tone="subtle" />
          </AppPressable>
        ) : null}
      </AppView>

      {isOpen && results.length > 0 ? (
        <AppView
          style={{ top: topInset + 8 + BAR_HEIGHT + 6, left: 16, right: 16 }}
          className="absolute z-20 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-md"
        >
          {results.map((place, index) => (
            <AppPressable
              key={place.id}
              onPress={() => handlePick(place)}
              accessibilityLabel={`${place.name}, ${place.address}`}
              className={`px-4 py-3 ${index > 0 ? 'border-t border-black/5' : ''}`}
            >
              <AppText numberOfLines={1} className="text-[15px] font-semibold text-foreground">
                {place.name}
              </AppText>
              <AppText numberOfLines={1} className="text-[13px] text-muted">
                {place.address}
              </AppText>
            </AppPressable>
          ))}
        </AppView>
      ) : null}
    </>
  );
}
