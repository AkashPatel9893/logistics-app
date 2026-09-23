import type { AddressLabel, GeoPoint, SavedAddress } from '@/lib/api/models';

import { db } from '../db';
import { body, created, HttpError, ok, randomId, requireUser } from '../http';
import { PLACES } from '../seed';
import type { Route } from './types';

const MAX_ADDRESSES = 12;

function listFor(userId: string): SavedAddress[] {
  return [...(db.addresses.get(userId) ?? [])].sort((a, b) =>
    b.lastUsedAt.localeCompare(a.lastUsedAt),
  );
}

function updateAddress(
  userId: string,
  id: string,
  patch: (address: SavedAddress) => SavedAddress,
): SavedAddress {
  const list = db.addresses.get(userId) ?? [];
  const target = list.find((a) => a.id === id);
  if (!target) throw new HttpError(404, 'ADDRESS_NOT_FOUND', 'Address not found.');
  const updated = patch(target);
  db.addresses.set(
    userId,
    list.map((a) => (a.id === id ? updated : a)),
  );
  return updated;
}

export const placeRoutes: Route[] = [
  {
    method: 'GET',
    path: '/places/search',
    handler: (req) => {
      const q = (req.query.q ?? '').trim().toLowerCase();
      if (q.length === 0) return ok([]);
      return ok(
        PLACES.filter(
          (place) =>
            place.name.toLowerCase().includes(q) || place.address.toLowerCase().includes(q),
        ),
      );
    },
  },
  {
    method: 'GET',
    path: '/me/addresses',
    handler: (req) => ok(listFor(requireUser(req))),
  },
  {
    // Create, or mark an existing (same name + address) as just used.
    method: 'POST',
    path: '/me/addresses',
    handler: (req) => {
      const userId = requireUser(req);
      const input = body<{ name: string; address: string; location: GeoPoint | null }>(req);
      if (!input.name?.trim())
        throw new HttpError(422, 'INVALID_NAME', 'Address name is required.');
      const list = db.addresses.get(userId) ?? [];
      const now = new Date().toISOString();
      const existing = list.find(
        (a) => a.name.toLowerCase() === input.name.toLowerCase() && a.address === input.address,
      );
      if (existing) {
        const touched = {
          ...existing,
          location: input.location ?? existing.location,
          lastUsedAt: now,
        };
        db.addresses.set(userId, [touched, ...list.filter((a) => a.id !== existing.id)]);
        return ok(touched, 'Address updated');
      }
      const address: SavedAddress = {
        id: randomId('addr'),
        name: input.name.trim(),
        address: input.address ?? '',
        label: 'recent',
        isFavorite: false,
        location: input.location ?? null,
        contact: null,
        lastUsedAt: now,
      };
      db.addresses.set(userId, [address, ...list].slice(0, MAX_ADDRESSES));
      return created(address, 'Address saved');
    },
  },
  {
    method: 'PATCH',
    path: '/me/addresses/:id',
    handler: (req) => {
      const input = body<{
        name?: string;
        address?: string;
        location?: GeoPoint | null;
        label?: AddressLabel;
      }>(req);
      return ok(
        updateAddress(requireUser(req), req.params.id, (a) => ({
          ...a,
          name: input.name?.trim() || a.name,
          address: input.address ?? a.address,
          location: input.location !== undefined ? input.location : a.location,
          label: input.label ?? a.label,
        })),
      );
    },
  },
  {
    method: 'PUT',
    path: '/me/addresses/:id/contact',
    handler: (req) => {
      const input = body<{ name: string; phone: string; houseNumber?: string }>(req);
      return ok(
        updateAddress(requireUser(req), req.params.id, (a) => ({
          ...a,
          contact: { name: input.name, phone: input.phone, houseNumber: input.houseNumber ?? '' },
        })),
      );
    },
  },
  {
    method: 'POST',
    path: '/me/addresses/:id/favorite',
    handler: (req) =>
      ok(
        updateAddress(requireUser(req), req.params.id, (a) => ({
          ...a,
          isFavorite: !a.isFavorite,
        })),
      ),
  },
  {
    method: 'DELETE',
    path: '/me/addresses/:id',
    handler: (req) => {
      const userId = requireUser(req);
      db.addresses.set(
        userId,
        (db.addresses.get(userId) ?? []).filter((a) => a.id !== req.params.id),
      );
      return ok(null, 'Address deleted');
    },
  },
];
