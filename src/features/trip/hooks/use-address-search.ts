import { useEffect, useState } from 'react';

import { usePlaceSearch, useSavedAddresses } from '@/hooks/use-addresses';
import type { AddressLabel, GeoPoint, SavedAddress } from '@/lib/api/models';
import { kvStorage } from '@/lib/storage';

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
  contactName?: string | null;
  contactPhone?: string | null;
}

const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 500;
// v3: drops the demo addresses that v2 stored on first use.
const RECENT_ADDRESSES_STORAGE_KEY = 'ryno_recent_addresses_v3';

/** A new user has no recents: nothing is pre-seeded. */
export const INITIAL_RECENT_ADDRESSES: DisplayAddress[] = [];

function loadLocalRecentAddresses(): DisplayAddress[] {
  const raw = kvStorage.getString(RECENT_ADDRESSES_STORAGE_KEY);
  if (!raw) return INITIAL_RECENT_ADDRESSES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECENT_ADDRESSES;
  } catch {
    return INITIAL_RECENT_ADDRESSES;
  }
}

export function saveLocalRecentAddress(address: DisplayAddress): void {
  const existing = loadLocalRecentAddresses();
  const filtered = existing.filter((a) => a.name.toLowerCase() !== address.name.toLowerCase());
  const updated = [address, ...filtered].slice(0, 15);
  kvStorage.setString(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
}

export function updateLocalRecentFavorite(id: string, isFavorite: boolean): void {
  const existing = loadLocalRecentAddresses();
  const updated = existing.map((a) =>
    a.id === id ? { ...a, isFavorite, isSaved: isFavorite } : a,
  );
  kvStorage.setString(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
}

function fromSaved(address: SavedAddress): DisplayAddress {
  return {
    id: address.id,
    name: address.name,
    address: address.address,
    iconType: address.label,
    isFavorite: address.isFavorite,
    location: address.location,
    isSaved: true,
    contactName: address.contact?.name ?? null,
    contactPhone: address.contact?.phone ?? null,
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
 * Results for the location picker: saved addresses, recent addresses,
 * and live geocoding/places matches.
 */
export function useAddressSearch(query: string, filterSavedOnly = false) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, LIVE_SEARCH_DEBOUNCE_MS);
  const { data: addresses = [], isLoading: isLoadingAddresses } = useSavedAddresses();
  const places = usePlaceSearch(debouncedQuery);
  const geocoded = useGeocodedResult(debouncedQuery);

  const localRecents = loadLocalRecentAddresses();
  const savedDisplays: DisplayAddress[] = addresses.map(fromSaved);

  const allItems: DisplayAddress[] = [];
  const seenNames = new Set<string>();

  for (const recent of localRecents) {
    const key = recent.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      const serverMatch = savedDisplays.find(
        (s) =>
          s.name.toLowerCase() === key || s.address.toLowerCase() === recent.address.toLowerCase(),
      );
      if (serverMatch) {
        allItems.push({
          ...recent,
          id: serverMatch.id,
          isSaved: true,
          isFavorite: serverMatch.isFavorite,
        });
      } else {
        allItems.push(recent);
      }
    }
  }

  for (const saved of savedDisplays) {
    const key = saved.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      allItems.push(saved);
    }
  }

  const lowerQuery = trimmedQuery.toLowerCase();
  let baseList = allItems;

  if (filterSavedOnly) {
    baseList = baseList.filter((a) => a.isSaved || a.isFavorite);
  }

  const matched = trimmedQuery
    ? baseList.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerQuery) ||
          a.address.toLowerCase().includes(lowerQuery) ||
          (a.contactName && a.contactName.toLowerCase().includes(lowerQuery)),
      )
    : baseList;

  const results: DisplayAddress[] = [...matched];
  const seenInResults = new Set(results.map((r) => r.name.toLowerCase()));

  if (trimmedQuery && !filterSavedOnly) {
    for (const place of places.data ?? []) {
      if (seenInResults.has(place.name.toLowerCase())) continue;
      seenInResults.add(place.name.toLowerCase());
      results.push({
        id: place.id,
        name: place.name,
        address: place.address,
        iconType: 'recent',
        isFavorite: false,
        location: place.location,
        isSaved: false,
        contactName: null,
      });
    }
    const live = geocoded.result;
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
