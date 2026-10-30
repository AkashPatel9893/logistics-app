import { env } from '@/env';
import { getUser } from '../auth/utils';
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

const GOOGLE_API_KEY = env.GOOGLE_MAPS_API_KEY;
const GOOGLE_AUTOCOMPLETE_URL = `${env.GOOGLE_MAPS_BASE_URL}/maps/api/place/autocomplete/json`;

export const placesApi = {
  /** Place suggestions from Google Places, nearest to `near` first. */
  search: async (q: string, signal?: AbortSignal, near?: GeoPoint | null): Promise<Place[]> => {
    // 1. Try Google Places Autocomplete if key is available
    if (GOOGLE_API_KEY) {
      try {
        const params = new URLSearchParams({ input: q, key: GOOGLE_API_KEY });
        if (near) params.set('location', `${near.latitude},${near.longitude}`);
        const res = await fetch(`${GOOGLE_AUTOCOMPLETE_URL}?${params.toString()}`, { signal });
        if (res.ok) {
          const body = (await res.json()) as { predictions?: any[]; status?: string };
          if (body.predictions && body.status !== 'REQUEST_DENIED') {
            return body.predictions.map((p) => {
              const point = p.geometry?.location;
              return {
                id: `place:${p.place_id}`,
                name: p.structured_formatting?.main_text || String(p.description).split(',')[0],
                address: p.structured_formatting?.secondary_text || p.description,
                location:
                  point?.lat !== undefined && point?.lng !== undefined
                    ? { latitude: Number(point.lat), longitude: Number(point.lng) }
                    : null,
              };
            });
          }
        }
      } catch {
        // Fall back to empty suggestions
      }
    }

    return [];
  },

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
    const userPhone = getUser()?.phone;
    const contactPhone = input.contact?.phone
      ? input.contact.phone.startsWith('+')
        ? input.contact.phone
        : `+91${input.contact.phone.replace(/\D/g, '').slice(-10)}`
      : userPhone || '+910000000000';

    const res = await request<any>({
      method: 'POST',
      url: '/customers/me/addresses',
      data: {
        label: (input.label ?? 'other').toUpperCase(),
        contact_name: input.contact?.name || input.name || 'Customer',
        contact_phone: contactPhone,
        address_line_1: input.address,
        city: 'Bengaluru',
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
    const userPhone = getUser()?.phone;
    const res = await request<any>({
      method: 'PUT',
      url: `/customers/me/addresses/${id}`,
      data: {
        label: input.label ? input.label.toUpperCase() : 'OTHER',
        contact_name: input.name || 'Customer',
        contact_phone: userPhone || '+910000000000',
        address_line_1: input.address || 'Updated Address',
        city: 'Bengaluru',
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
