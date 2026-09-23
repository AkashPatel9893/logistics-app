import { useEffect, useState } from 'react';

import { usePlaceSearch, useSavedAddresses } from '@/hooks/use-addresses';
import type { AddressLabel, GeoPoint, SavedAddress } from '@/lib/api/models';

import { searchAddress, type GeocodedSearchResult } from '../geocoding';

export interface DisplayAddress {
  id: string;
  name: string;
  address: string;
  iconType: AddressLabel | 'search';
  isFavorite: boolean;
  location: GeoPoint | null;
  /** Only saved addresses can be edited or favorited. */
  isSaved: boolean;
}

const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 600;

function fromSaved(address: SavedAddress): DisplayAddress {
  return {
    id: address.id,
    name: address.name,
    address: address.address,
    iconType: address.label,
    isFavorite: address.isFavorite,
    location: address.location,
    isSaved: true,
  };
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/** Device-geocoder fallback for free text the places API doesn't know. */
function useGeocodedResult(query: string) {
  const [result, setResult] = useState<{ query: string; value: GeocodedSearchResult | null }>();

  useEffect(() => {
    if (query.length < LIVE_SEARCH_MIN_LENGTH) return;
    let cancelled = false;
    searchAddress(query)
      .catch(() => null)
      .then((value) => {
        if (!cancelled) setResult({ query, value });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const isCurrent = result?.query === query;
  return {
    result: isCurrent ? result.value : null,
    isSearching: query.length >= LIVE_SEARCH_MIN_LENGTH && !isCurrent,
  };
}

/**
 * Results for the location picker: saved addresses and the places API first,
 * plus a device-geocoder match for anything they don't cover.
 */
export function useAddressSearch(query: string) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, LIVE_SEARCH_DEBOUNCE_MS);
  const { data: addresses = [], isLoading: isLoadingAddresses } = useSavedAddresses();
  const places = usePlaceSearch(debouncedQuery);
  const geocoded = useGeocodedResult(debouncedQuery);

  const lowerQuery = trimmedQuery.toLowerCase();
  const savedMatches = trimmedQuery
    ? addresses.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerQuery) || a.address.toLowerCase().includes(lowerQuery),
      )
    : addresses;

  const results: DisplayAddress[] = savedMatches.map(fromSaved);
  const seen = new Set(results.map((r) => r.name.toLowerCase()));

  if (trimmedQuery) {
    for (const place of places.data ?? []) {
      if (seen.has(place.name.toLowerCase())) continue;
      seen.add(place.name.toLowerCase());
      results.push({
        id: place.id,
        name: place.name,
        address: place.address,
        iconType: 'recent',
        isFavorite: false,
        location: place.location,
        isSaved: false,
      });
    }
    const live = geocoded.result;
    if (live && !seen.has(live.name.toLowerCase())) {
      results.unshift({
        id: `live:${live.name}`,
        name: live.name,
        address: live.address,
        iconType: 'search',
        isFavorite: false,
        location: live.region,
        isSaved: false,
      });
    }
  }

  const isSearching = trimmedQuery !== debouncedQuery || places.isFetching || geocoded.isSearching;

  return {
    trimmedQuery,
    results,
    isLoading: isLoadingAddresses,
    isSearching: trimmedQuery.length > 0 && isSearching,
    showNoResults:
      trimmedQuery.length >= LIVE_SEARCH_MIN_LENGTH && !isSearching && results.length === 0,
  };
}
