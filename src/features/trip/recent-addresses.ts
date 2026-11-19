import type { AddressLabel, GeoPoint } from '@/lib/api/models';
import { kvStorage, useStorageString } from '@/lib/storage';

export interface DisplayAddress {
  id: string;
  name: string;
  address: string;
  iconType: AddressLabel | 'search';
  isFavorite: boolean;
  location: GeoPoint | null;
  isSaved: boolean;
  street?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  usedAsDrop?: boolean;
}

const RECENT_ADDRESSES_STORAGE_KEY = 'ryno_recent_addresses_v3';

export const INITIAL_RECENT_ADDRESSES: DisplayAddress[] = [];

let cachedRecentAddresses: DisplayAddress[] | null = null;

function parseRecentAddresses(raw: string | null | undefined): DisplayAddress[] {
  if (!raw) return INITIAL_RECENT_ADDRESSES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_RECENT_ADDRESSES;
  } catch {
    return INITIAL_RECENT_ADDRESSES;
  }
}

export function loadLocalRecentAddresses(): DisplayAddress[] {
  if (cachedRecentAddresses) return cachedRecentAddresses;
  cachedRecentAddresses = parseRecentAddresses(kvStorage.getString(RECENT_ADDRESSES_STORAGE_KEY));
  return cachedRecentAddresses;
}

export function useRecentDrops(limit: number): DisplayAddress[] {
  const [raw] = useStorageString(RECENT_ADDRESSES_STORAGE_KEY);
  const list = raw ? parseRecentAddresses(raw) : loadLocalRecentAddresses();
  return list.filter((place) => place.location && place.usedAsDrop).slice(0, limit);
}

export function saveLocalRecentAddress(address: DisplayAddress): void {
  const existing = loadLocalRecentAddresses();
  const isSamePlace = (a: DisplayAddress) => a.name.toLowerCase() === address.name.toLowerCase();
  const filtered = existing.filter((a) => !isSamePlace(a));
  const usedAsDrop = address.usedAsDrop || existing.some((a) => isSamePlace(a) && a.usedAsDrop);
  const updated = [{ ...address, usedAsDrop }, ...filtered].slice(0, 15);
  cachedRecentAddresses = updated;
  kvStorage.setString(RECENT_ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
}

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
