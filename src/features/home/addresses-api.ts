import { File, Paths } from 'expo-file-system';

import type { ApiResponse } from '@/lib/api';
import { kvStorage } from '@/lib/storage';

import type { PickedRegion, SavedAddress } from '@/stores/trip-store';

const ADDRESSES_STORAGE_KEY = 'saved_addresses_v1';
const MAX_ADDRESSES = 12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ok<T>(data: T, message = 'OK'): ApiResponse<T> {
  return { success: true, statusCode: 200, message, data, timestamp: new Date().toISOString() };
}

function readAddresses(): SavedAddress[] {
  const raw = kvStorage.getString(ADDRESSES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Human-readable mirror of the saved addresses, written alongside MMKV so
// the data can be inspected as a plain file. MMKV stays the real store this
// module reads from — this file is a debug-visibility copy, not the source
// of truth, and a failed write here never blocks a save.
const mirrorFile = new File(Paths.document, 'saved-addresses.json');

if (__DEV__) {
  console.log('[addresses-api] saved-addresses.json mirror path:', mirrorFile.uri);
}

function writeAddressesMirror(addresses: SavedAddress[]): void {
  try {
    if (!mirrorFile.exists) {
      mirrorFile.create({ overwrite: true });
    }
    mirrorFile.write(JSON.stringify(addresses, null, 2));
  } catch (error) {
    if (__DEV__) {
      console.warn('[addresses-api] Failed to write saved-addresses.json mirror:', error);
    }
  }
}

function writeAddresses(addresses: SavedAddress[]): void {
  kvStorage.setString(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
  writeAddressesMirror(addresses);
}

/**
 * Mock "backend" for saved addresses — async, latency-simulated, and
 * ApiResponse-shaped like a real endpoint would be. Backed by MMKV today;
 * swapping these bodies for real HTTP calls (via `@/lib/api`'s client) is
 * a drop-in change since every caller already awaits an ApiResponse.
 */

export async function getSavedAddresses(): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(150);
  return ok(readAddresses());
}

export interface TouchSavedAddressInput {
  id?: string;
  name: string;
  address: string;
  region?: PickedRegion | null;
}

// Selecting a recent/search result: create it, or move an exact existing
// match to the front (refreshing its region if we now have one).
export async function touchSavedAddress(
  input: TouchSavedAddressInput,
): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(200);
  const addresses = readAddresses();
  const existing = addresses.find(
    (a) => a.name.toLowerCase() === input.name.toLowerCase() && a.address === input.address,
  );

  let next: SavedAddress[];
  if (existing) {
    const updated: SavedAddress = { ...existing, region: input.region ?? existing.region };
    next = [updated, ...addresses.filter((a) => a.id !== existing.id)];
  } else {
    const created: SavedAddress = {
      id: input.id ?? `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      address: input.address,
      iconType: 'recent',
      isFavorited: false,
      savedAt: Date.now(),
      region: input.region ?? null,
    };
    next = [created, ...addresses].slice(0, MAX_ADDRESSES);
  }

  writeAddresses(next);
  return ok(next);
}

export async function updateSavedAddress(
  id: string,
  updates: { name: string; address: string; region?: PickedRegion | null },
): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(200);
  const next = readAddresses().map((a) =>
    a.id === id
      ? {
          ...a,
          name: updates.name,
          address: updates.address,
          region: updates.region !== undefined ? updates.region : a.region,
        }
      : a,
  );

  writeAddresses(next);
  return ok(next);
}

export interface SavedAddressContact {
  houseNumber: string;
  contactName: string;
  contactPhone: string;
}

// Remembers the contact info last entered at an address, so the details
// modal can pre-fill it next time this same address is picked.
export async function updateSavedAddressContact(
  id: string,
  contact: SavedAddressContact,
): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(150);
  const next = readAddresses().map((a) =>
    a.id === id
      ? {
          ...a,
          houseNumber: contact.houseNumber,
          contactName: contact.contactName,
          contactPhone: contact.contactPhone,
        }
      : a,
  );

  writeAddresses(next);
  return ok(next);
}

export async function toggleFavoriteSavedAddress(id: string): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(150);
  const next = readAddresses().map((a) =>
    a.id === id ? { ...a, isFavorited: !a.isFavorited } : a,
  );

  writeAddresses(next);
  return ok(next);
}

export async function deleteSavedAddress(id: string): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(150);
  const next = readAddresses().filter((a) => a.id !== id);

  writeAddresses(next);
  return ok(next);
}

export async function resetSavedAddresses(): Promise<ApiResponse<SavedAddress[]>> {
  await sleep(100);
  writeAddresses([]);
  return ok([]);
}
