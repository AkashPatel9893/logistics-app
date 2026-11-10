import { useEffect, useRef, useState, type RefObject } from 'react';
import { Alert, Keyboard, StyleSheet, TextInput, type TextInputInstance } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';
import { usePlaceSearch } from '@/hooks/use-addresses';
import { useThemeColor } from '@/hooks/use-theme-color';
import { placesApi } from '@/lib/api/places';
import { cn } from '@/lib/cn';
import type { GeoPoint } from '@/lib/geo';
import { DURATION } from '@/lib/motion';

import { geocodeAddress } from '../geocoding';
import { useDebouncedValue } from '../hooks/use-address-search';

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;
const MAX_RESULTS = 5;
const BAR_HEIGHT = 48;
const SIDE = 16;
const GAP = 10;

export interface MapSearchBarProps {
  topInset: number;
  /** Map center, so suggestions are biased toward the area being looked at. */
  near: GeoPoint;
  onSelect: (point: GeoPoint, place: { label: string; address: string }) => void;
  onFocusChange?: (isFocused: boolean) => void;
  /** Back button at the start of the row, styled to match the bar. */
  onBack?: () => void;
  placeholder?: string;
  /** Lets the screen focus the field itself, after it has made room (see `onRequestFocus`). */
  inputRef?: RefObject<TextInputInstance | null>;
  /**
   * When given, a tap on the bar asks for focus instead of taking it, so the screen can first
   * slide its sheet away and then open the keyboard: one motion after the other, not both at once.
   */
  onRequestFocus?: () => void;
}

/** "Indiranagar Club" with the typed part in bold, so the eye finds the match. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const index = name.toLowerCase().indexOf(query.toLowerCase());
  if (!query || index < 0) {
    return (
      <AppText numberOfLines={1} className="text-[15px] font-semibold text-foreground">
        {name}
      </AppText>
    );
  }
  return (
    <AppText numberOfLines={1} className="text-[15px] font-medium text-foreground">
      {name.slice(0, index)}
      <AppText className="text-[15px] font-extrabold text-foreground">
        {name.slice(index, index + query.length)}
      </AppText>
      {name.slice(index + query.length)}
    </AppText>
  );
}

/**
 * Back button and search box floating over the map as one row; picking a result moves the pin
 * there. Results drop down as a card under the row.
 */
export function MapSearchBar({
  topInset,
  near,
  onSelect,
  onFocusChange,
  onBack,
  placeholder = 'Search a place',
  inputRef,
  onRequestFocus,
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const placeholderColor = useThemeColor('icon-subtle');
  const ownInputRef = useRef<TextInputInstance>(null);
  const fieldRef = inputRef ?? ownInputRef;

  // Android's back key hides the keyboard but leaves the field focused (and outlined): drop the
  // focus too, so the bar looks as idle as it is.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => fieldRef.current?.blur());
    return () => sub.remove();
  }, [fieldRef]);

  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const places = usePlaceSearch(debouncedQuery, near);
  const results = (places.data ?? []).slice(0, MAX_RESULTS);
  const isOpen = trimmed.length >= MIN_QUERY_LENGTH;
  const isSearching = isOpen && (trimmed !== debouncedQuery || places.isFetching);
  const showEmpty = isOpen && !isSearching && results.length === 0;

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

  const top = topInset + 8;
  const barLeft = onBack ? SIDE + BAR_HEIGHT + GAP : SIDE;

  return (
    <>
      {onBack ? (
        <AppPressable
          onPress={onBack}
          pressScale={0.92}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.shadow, { top, left: SIDE, width: BAR_HEIGHT, height: BAR_HEIGHT }]}
          className="absolute z-20 items-center justify-center rounded-full bg-surface"
        >
          <Icon name="chevron.left" size={22} tone="foreground" />
        </AppPressable>
      ) : null}

      <AppView
        pointerEvents="box-none"
        style={[styles.shadow, { top, left: barLeft, right: SIDE, height: BAR_HEIGHT }]}
        className={cn(
          'absolute z-20 flex-row items-center rounded-full bg-surface pl-1.5 pr-3',
          isFocused ? 'border-2 border-brand' : 'border border-black/5',
        )}
      >
        <AppView center className="mr-2 size-9 rounded-full bg-brand-tint">
          <Icon name="magnifyingglass" size={17} tone="brand" />
        </AppView>
        <TextInput
          ref={fieldRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            setIsFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            onFocusChange?.(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          onSubmitEditing={() => results[0] && handlePick(results[0])}
          autoCorrect={false}
          className="flex-1 p-0 text-[15px] font-medium text-foreground"
        />
        {isSearching || isResolving ? (
          <AppSpinner tone="brand" />
        ) : query.length > 0 ? (
          <AppPressable
            onPress={() => setQuery('')}
            accessibilityLabel="Clear search"
            hitSlop={10}
            className="size-7 items-center justify-center rounded-full bg-surface-muted"
          >
            <Icon name="xmark.circle.fill" size={16} tone="icon-subtle" />
          </AppPressable>
        ) : null}
        {onRequestFocus ? (
          <AppPressable
            onPress={onRequestFocus}
            accessibilityRole="search"
            accessibilityLabel={placeholder}
            className="absolute inset-0 rounded-full"
          />
        ) : null}
      </AppView>

      {isOpen && (results.length > 0 || showEmpty) ? (
        <AnimatedView
          entering={FadeIn.duration(DURATION.small)}
          exiting={FadeOut.duration(DURATION.small)}
          style={[styles.shadow, { top: top + BAR_HEIGHT + 8, left: SIDE, right: SIDE }]}
          className="absolute z-20 overflow-hidden rounded-3xl border border-black/5 bg-surface py-1.5"
        >
          {showEmpty ? (
            <AppView className="flex-row items-center px-4 py-4">
              <Icon name="magnifyingglass" size={16} tone="icon-subtle" />
              <AppText className="ml-3 flex-1 text-[14px] text-muted">
                No places found for “{trimmed}”. Try a landmark or area name.
              </AppText>
            </AppView>
          ) : (
            results.map((place, index) => (
              <AppPressable
                key={place.id}
                onPress={() => handlePick(place)}
                pressScale={0.99}
                accessibilityLabel={`${place.name}, ${place.address}`}
                className="flex-row items-center px-3 py-2.5 active:bg-surface-muted"
              >
                <AppView
                  center
                  className={cn(
                    'mr-3 size-9 rounded-full',
                    index === 0 ? 'bg-brand-tint' : 'bg-surface-muted',
                  )}
                >
                  <Icon name="mappin" size={16} tone={index === 0 ? 'brand' : 'icon-subtle'} />
                </AppView>
                <AppView className="flex-1">
                  <HighlightedName name={place.name} query={trimmed} />
                  <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                    {place.address}
                  </AppText>
                </AppView>
              </AppPressable>
            ))
          )}
        </AnimatedView>
      ) : null}
    </>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
});
