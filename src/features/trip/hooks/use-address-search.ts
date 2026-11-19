import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { AddressLabel, GeoPoint, SavedAddress } from '@/lib/api/models';
import { kvStorage, useStorageString } from '@/lib/storage';
import { usePlaceSearch, useSavedAddresses } from '@/queries/use-address-queries';

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
  /** A saved address's street line, sent with the order instead of its nickname. */
  street?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  /** A recent place the customer has delivered to, not only picked up from. */
  usedAsDrop?: boolean;
}

const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 650;
// v3: drops the demo addresses that v2 stored on first use.
const RECENT_ADDRESSES_STORAGE_KEY = 'ryno_recent_addresses_v3';

/** A new user has no recents: nothing is pre-seeded. */
export const INITIAL_RECENT_ADDRESSES: DisplayAddress[] = [];

let cachedRecentAddresses: DisplayAddress[] | null = null;

export function loadLocalRecentAddresses(): DisplayAddress[] {
  if (cachedRecentAddresses) return cachedRecentAddresses;
  const raw = kvStorage.getString(RECENT_ADDRESSES_STORAGE_KEY);
  if (!raw) {
    cachedRecentAddresses = INITIAL_RECENT_ADDRESSES;
    return cachedRecentAddresses;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedRecentAddresses = Array.isArray(parsed) ? parsed : INITIAL_RECENT_ADDRESSES;
  } catch {
    cachedRecentAddresses = INITIAL_RECENT_ADDRESSES;
  }
  return cachedRecentAddresses;
}

export function useRecentDrops(limit: number): DisplayAddress[] {
  const [raw] = useStorageString(RECENT_ADDRESSES_STORAGE_KEY);
  let list: DisplayAddress[];
  if (!raw) {
    list = loadLocalRecentAddresses();
  } else {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : INITIAL_RECENT_ADDRESSES;
    } catch {
      list = INITIAL_RECENT_ADDRESSES;
    }
  }
  return list.filter((place) => place.location && place.usedAsDrop).slice(0, limit);
}

export function saveLocalRecentAddress(address: DisplayAddress): void {
  const existing = loadLocalRecentAddresses();
  const isSamePlace = (a: DisplayAddress) => a.name.toLowerCase() === address.name.toLowerCase();
  const filtered = existing.filter((a) => !isSamePlace(a));
  // Being used as a pickup later must not lose that a place was once a drop.
  const usedAsDrop = address.usedAsDrop || existing.some((a) => isSamePlace(a) && a.usedAsDrop);
  const updated = [{ ...address, usedAsDrop }, ...filtered].slice(0, 15);
  cachedRecentAddresses = updated;
  kvStorage.setString(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
}

/** Recents belong to the signed-in customer; called on sign-out so the next account starts empty. */
export function clearLocalRecentAddresses(): void {
  cachedRecentAddresses = [];
  kvStorage.setString(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify([]));
}

export function updateLocalRecentFavorite(id: string, isFavorite: boolean): void {
  const existing = loadLocalRecentAddresses();
  const updated = existing.map((a) =>
    a.id === id ? { ...a, isFavorite, isSaved: isFavorite } : a,
  );
  cachedRecentAddresses = updated;
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
    street: address.address,
    contactName: address.contact?.name ?? null,
    contactPhone: address.contact?.phone ?? null,
  };
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
          street: serverMatch.street,
          isFavorite: serverMatch.isFavorite,
        });
      } else {
        // Saved-ness comes from the server: a place deleted from Saved addresses is not saved,
        // whatever this device remembered.
        allItems.push({ ...recent, isSaved: false, isFavorite: false });
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
        iconType: 'search',
        isFavorite: false,
        location: place.location,
        isSaved: false,
        contactName: null,
      });
    }
    // The phone's geocoder is only a fallback for when the provider finds nothing.
    const live = (places.data ?? []).length === 0 ? geocoded.result : null;
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
