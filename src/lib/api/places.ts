import { request } from './client';
import type { AddressLabel, GeoPoint, Place, SavedAddress } from './models';

export interface SaveAddressInput {
  name: string;
  address: string;
  location: GeoPoint | null;
  /** "Save as" tag chosen by the customer; untagged saves are stored as OTHER. */
  label?: 'home' | 'shop' | 'other';
  /** Who to reach at this address (10-digit phone). */
  contact?: { name: string; phone: string };
}

/** Icon family for a backend label — shops share the work/business icon. */
function toAddressLabel(label: string | null | undefined): AddressLabel {
  const value = label?.toLowerCase();
  if (value === 'home') return 'home';
  if (value === 'work' || value === 'shop') return 'work';
  return 'other';
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export const placesApi = {
  search: (q: string, signal?: AbortSignal) =>
    request<Place[]>({ url: '/places/search', params: { q }, signal }),

  listAddresses: async (signal?: AbortSignal): Promise<SavedAddress[]> => {
    const res = await request<any[]>({ url: '/customers/me/addresses', signal });
    return (res ?? []).map((a) => {
      const displayName =
        a.label && a.label.toUpperCase() !== 'OTHER'
          ? titleCase(a.label)
          : a.landmark || a.address_line_1 || 'Address';
      return {
        id: a.id,
        name: displayName,
        address: `${a.address_line_1}${a.city ? ', ' + a.city : ''}`,
        label: toAddressLabel(a.label),
        isFavorite: Boolean(a.is_default),
        location:
          a.latitude && a.longitude
            ? { latitude: Number(a.latitude), longitude: Number(a.longitude) }
            : null,
        contact: a.contact_name
          ? {
              name: a.contact_name,
              phone: a.contact_phone_e164 ?? '',
              houseNumber: a.address_line_2 ?? '',
            }
          : null,
        lastUsedAt: a.updated_at ?? new Date().toISOString(),
      };
    });
  },

  /** Creates the address, or marks an existing one as just used. */
  saveAddress: async (input: SaveAddressInput): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'POST',
      url: '/customers/me/addresses',
      data: {
        label: (input.label ?? 'other').toUpperCase(),
        contact_name: input.contact?.name || input.name || 'Customer',
        contact_phone: input.contact ? `+91${input.contact.phone}` : '+919876543210',
        address_line_1: input.address,
        city: 'Dev City',
        state: 'Karnataka',
        postal_code: '560001',
        latitude: input.location?.latitude ?? 12.9716,
        longitude: input.location?.longitude ?? 77.5946,
        is_default: false,
      },
    });
    return {
      id: res.id,
      name: input.label && input.label !== 'other' ? titleCase(input.label) : input.name,
      address: res.address_line_1,
      label: toAddressLabel(input.label),
      isFavorite: Boolean(res.is_default),
      location: input.location,
      contact: input.contact ? { ...input.contact, houseNumber: '' } : null,
      lastUsedAt: new Date().toISOString(),
    };
  },

  updateAddress: async (
    id: string,
    input: { name?: string; address?: string; location?: GeoPoint | null; label?: AddressLabel },
  ): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'PUT',
      url: `/customers/me/addresses/${id}`,
      data: {
        label: input.label ? input.label.toUpperCase() : 'OTHER',
        contact_name: input.name || 'Customer',
        contact_phone: '+919876543210',
        address_line_1: input.address || 'Updated Address',
        city: 'Dev City',
        state: 'Karnataka',
        postal_code: '560001',
        latitude: input.location?.latitude ?? 12.9716,
        longitude: input.location?.longitude ?? 77.5946,
        is_default: false,
      },
    });
    return {
      id: res.id,
      name: res.label ?? input.name,
      address: res.address_line_1,
      label: (res.label?.toLowerCase() || 'other') as AddressLabel,
      isFavorite: Boolean(res.is_default),
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: null,
      lastUsedAt: res.updated_at ?? new Date().toISOString(),
    };
  },

  saveContact: async (
    id: string,
    contact: { name: string; phone: string; houseNumber: string },
  ): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'PUT',
      url: `/customers/me/addresses/${id}`,
      data: { address_line_2: contact.houseNumber },
    });
    return {
      id: res.id,
      name: res.label ?? 'Address',
      address: res.address_line_1,
      label: (res.label?.toLowerCase() === 'home' || res.label?.toLowerCase() === 'work'
        ? res.label.toLowerCase()
        : 'other') as AddressLabel,
      isFavorite: Boolean(res.is_favorite ?? res.is_default),
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: { name: contact.name, phone: contact.phone, houseNumber: contact.houseNumber },
      lastUsedAt: res.updated_at ?? new Date().toISOString(),
    };
  },

  toggleFavorite: async (id: string): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'PUT',
      url: `/customers/me/addresses/${id}`,
      data: { is_favorite: true },
    });
    return {
      id: res.id,
      name: res.label ?? 'Address',
      address: res.address_line_1,
      label: (res.label?.toLowerCase() === 'home' || res.label?.toLowerCase() === 'work'
        ? res.label.toLowerCase()
        : 'other') as AddressLabel,
      isFavorite: true,
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: null,
      lastUsedAt: res.updated_at ?? new Date().toISOString(),
    };
  },

  deleteAddress: (id: string) => {
    return request<null>({ method: 'DELETE', url: `/customers/me/addresses/${id}` });
  },
};
