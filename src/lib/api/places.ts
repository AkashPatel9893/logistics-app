import { request } from './client';
import type { AddressLabel, GeoPoint, Place, SavedAddress } from './models';

export interface SaveAddressInput {
  name: string;
  address: string;
  location: GeoPoint | null;
}

export const placesApi = {
  search: (q: string, signal?: AbortSignal) =>
    request<Place[]>({ url: '/places/search', params: { q }, signal }),

  listAddresses: (signal?: AbortSignal) =>
    request<SavedAddress[]>({ url: '/me/addresses', signal }),

  /** Creates the address, or marks an existing one as just used. */
  saveAddress: (input: SaveAddressInput) =>
    request<SavedAddress>({ method: 'POST', url: '/me/addresses', data: input }),

  updateAddress: (
    id: string,
    input: { name?: string; address?: string; location?: GeoPoint | null; label?: AddressLabel },
  ) => request<SavedAddress>({ method: 'PATCH', url: `/me/addresses/${id}`, data: input }),

  saveContact: (id: string, contact: { name: string; phone: string; houseNumber: string }) =>
    request<SavedAddress>({ method: 'PUT', url: `/me/addresses/${id}/contact`, data: contact }),

  toggleFavorite: (id: string) =>
    request<SavedAddress>({ method: 'POST', url: `/me/addresses/${id}/favorite` }),

  deleteAddress: (id: string) => request<null>({ method: 'DELETE', url: `/me/addresses/${id}` }),
};
