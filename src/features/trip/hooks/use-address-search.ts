import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { GeoPoint, SavedAddress } from '@/lib/api/models';
import { usePlaceSearch, useSavedAddresses } from '@/queries/use-address-queries';

import { searchAddress, type GeocodedSearchResult } from '../geocoding';
import { loadLocalRecentAddresses, type DisplayAddress } from '../recent-addresses';

export {
  clearLocalRecentAddresses,
  INITIAL_RECENT_ADDRESSES,
  loadLocalRecentAddresses,
  saveLocalRecentAddress,
  updateLocalRecentFavorite,
  useRecentDrops,
  type DisplayAddress,
} from '../recent-addresses';

const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 650;

function fromSaved(address: SavedAddress): DisplayAddress {
  return {
    id: address.id,
    name: address.name,
    address: address.address,
    iconType: address.label,
    isFavorite: address.isFavorite,
    location: address.location,
    isSaved: true,
    street: address.address,
    contactName: address.contact?.name ?? null,
    contactPhone: address.contact?.phone ?? null,
  };
}

function mergeSavedAndRecent(
  localRecents: DisplayAddress[],
  savedDisplays: DisplayAddress[],
): DisplayAddress[] {
  const merged: DisplayAddress[] = [];
  const seenNames = new Set<string>();

  for (const recent of localRecents) {
    const key = recent.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);

    const serverMatch = savedDisplays.find(
      (s) =>
        s.name.toLowerCase() === key || s.address.toLowerCase() === recent.address.toLowerCase(),
    );
    if (serverMatch) {
      merged.push({
        ...recent,
        id: serverMatch.id,
        isSaved: true,
        street: serverMatch.street,
        isFavorite: serverMatch.isFavorite,
      });
    } else {
      merged.push({ ...recent, isSaved: false, isFavorite: false });
    }
  }

  for (const saved of savedDisplays) {
    const key = saved.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    merged.push(saved);
  }

  return merged;
}

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

export function useAddressSearch(
  query: string,
  filterSavedOnly = false,
  near: GeoPoint | null = null,
) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, LIVE_SEARCH_DEBOUNCE_MS);
  const { data: addresses = [], isLoading: isLoadingAddresses } = useSavedAddresses();
  const places = usePlaceSearch(debouncedQuery, near);
  const geocoded = useGeocodedResult(debouncedQuery);

  const allItems = mergeSavedAndRecent(loadLocalRecentAddresses(), addresses.map(fromSaved));
  const baseList = filterSavedOnly ? allItems.filter((a) => a.isSaved || a.isFavorite) : allItems;

  const lowerQuery = trimmedQuery.toLowerCase();
  const matched = trimmedQuery
    ? baseList.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerQuery) ||
          a.address.toLowerCase().includes(lowerQuery) ||
          Boolean(a.contactName && a.contactName.toLowerCase().includes(lowerQuery)),
      )
    : baseList;

  const results: DisplayAddress[] = [...matched];
  const seenInResults = new Set(results.map((r) => r.name.toLowerCase()));

  if (trimmedQuery && !filterSavedOnly) {
    const providerPlaces = places.data ?? [];
    for (const place of providerPlaces) {
      const key = place.name.toLowerCase();
      if (seenInResults.has(key)) continue;
      seenInResults.add(key);
      results.push({
        id: place.id,
        name: place.name,
        address: place.address,
        iconType: 'search',
        isFavorite: false,
        location: place.location,
        isSaved: false,
        contactName: null,
      });
    }

    const live = providerPlaces.length === 0 ? geocoded.result : null;
    if (live && !seenInResults.has(live.name.toLowerCase())) {
      results.unshift({
        id: `live:${live.name}`,
        name: live.name,
        address: live.address,
        iconType: 'search',
        isFavorite: false,
        location: live.region,
        isSaved: false,
        contactName: null,
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
