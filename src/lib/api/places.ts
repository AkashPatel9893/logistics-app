import { fetch } from 'react-native-nitro-fetch';

import { env } from '@/config/env';
import { LegacyLocation } from '@/lib/location';

import { getUser } from '../auth/utils';
import { request } from './client';
import { APP_RESTRICTION_HEADERS } from './directions';
import type { AddressLabel, GeoPoint, Place, SavedAddress } from './models';

export interface SaveAddressInput {
  name: string;
  address: string;
  location: GeoPoint | null;
  customName?: string;
  label?: 'home' | 'shop' | 'other';
  contact?: { name: string; phone: string };
}

function toAddressLabel(label: string | null | undefined): AddressLabel {
  const value = label?.toLowerCase();
  if (value === 'home') return 'home';
  if (value === 'work' || value === 'shop') return 'work';
  return 'other';
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function mapSavedAddress(res: any, overrides?: Partial<SavedAddress>): SavedAddress {
  const defaultName =
    res.label && res.label.toUpperCase() !== 'OTHER'
      ? titleCase(res.label)
      : res.landmark || res.address_line_1 || 'Address';

  return {
    id: res.id,
    name: defaultName,
    address: `${res.address_line_1}${res.city ? `, ${res.city}` : ''}`,
    label: toAddressLabel(res.label),
    isFavorite: Boolean(res.is_favorite ?? res.is_default),
    location:
      res.latitude && res.longitude
        ? { latitude: Number(res.latitude), longitude: Number(res.longitude) }
        : null,
    contact: res.contact_name
      ? {
          name: res.contact_name,
          phone: res.contact_phone_e164 ?? '',
          houseNumber: res.address_line_2 ?? '',
        }
      : null,
    lastUsedAt: res.updated_at ?? new Date().toISOString(),
    ...overrides,
  };
}

const GOOGLE_API_KEY = env.GOOGLE_MAPS_API_KEY;
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

let sessionToken = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const newSessionToken = () => {
  sessionToken = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

export const placesApi = {
  search: async (q: string, signal?: AbortSignal, near?: GeoPoint | null): Promise<Place[]> => {
    if (GOOGLE_API_KEY) {
      try {
        const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            ...APP_RESTRICTION_HEADERS,
          },
          body: JSON.stringify({
            input: q,
            sessionToken,
            includedRegionCodes: ['in'],
            ...(near
              ? {
                  locationBias: {
                    circle: {
                      center: { latitude: near.latitude, longitude: near.longitude },
                      radius: 50_000,
                    },
                  },
                }
              : {}),
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as {
            suggestions?: {
              placePrediction?: {
                placeId: string;
                text?: { text: string };
                structuredFormat?: {
                  mainText?: { text: string };
                  secondaryText?: { text: string };
                };
              };
            }[];
          };
          const places: Place[] = (body.suggestions ?? []).flatMap((suggestion) => {
            const p = suggestion.placePrediction;
            if (!p) return [];
            const full = p.text?.text ?? '';
            return [
              {
                id: `place:${p.placeId}`,
                name: p.structuredFormat?.mainText?.text || full.split(',')[0],
                address: p.structuredFormat?.secondaryText?.text || full,
                location: null,
              },
            ];
          });
          if (places.length > 0) return places;
        }
      } catch {}
    }

    try {
      const fallbackToken = `session-${Date.now()}`;
      const params: Record<string, string | number> = { q, session_token: fallbackToken };
      if (near) {
        params.lat = near.latitude;
        params.lng = near.longitude;
      }
      const suggestions = await request<any[]>({
        url: '/places/autocomplete',
        params,
        signal,
      });
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          location: null,
        }));
      }
    } catch {}

    return [];
  },

  getPlaceLocation: async (placeId: string, signal?: AbortSignal): Promise<GeoPoint | null> => {
    if (!GOOGLE_API_KEY) return null;
    const id = placeId.replace(/^place:/, '');
    try {
      const res = await fetch(
        `${PLACES_DETAILS_URL}/${encodeURIComponent(id)}?sessionToken=${sessionToken}`,
        {
          signal,
          headers: {
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'location',
            ...APP_RESTRICTION_HEADERS,
          },
        },
      );
      newSessionToken();
      if (!res.ok) return null;
      const body = (await res.json()) as { location?: { latitude: number; longitude: number } };
      return body.location
        ? { latitude: body.location.latitude, longitude: body.location.longitude }
        : null;
    } catch {
      return null;
    }
  },

  listAddresses: async (signal?: AbortSignal): Promise<SavedAddress[]> => {
    const res = await request<any[]>({ url: '/customers/me/addresses', signal });
    return (res ?? []).map((a) => mapSavedAddress(a));
  },

  saveAddress: async (input: SaveAddressInput): Promise<SavedAddress> => {
    const userPhone = getUser()?.phone;
    if (!input.location) throw new Error('Choose a location before saving this address.');
    const [address] = await LegacyLocation.reverseGeocodeAsync(input.location);
    if (!address?.city || !address.region || !address.postalCode) {
      throw new Error('Could not determine the city, state and postal code for this location.');
    }
    const contactName = input.contact?.name || getUser()?.name;
    if (!contactName) throw new Error('Add a contact name before saving this address.');
    const contactPhone = input.contact?.phone
      ? input.contact.phone.startsWith('+')
        ? input.contact.phone
        : `+91${input.contact.phone.replace(/\D/g, '').slice(-10)}`
      : userPhone;
    if (!contactPhone) throw new Error('Add a contact phone number before saving this address.');

    const res = await request<any>({
      method: 'POST',
      url: '/customers/me/addresses',
      data: {
        label: (input.label ?? 'other').toUpperCase(),
        contact_name: contactName,
        contact_phone: contactPhone,
        address_line_1: input.address,
        city: address.city,
        state: address.region,
        postal_code: address.postalCode,
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        ...(input.customName ? { landmark: input.customName } : {}),
        is_default: false,
      },
    });
    return mapSavedAddress(res, {
      name:
        input.label && input.label !== 'other'
          ? titleCase(input.label)
          : (input.customName ?? input.name),
      address: res.address_line_1,
      label: toAddressLabel(input.label),
      isFavorite: Boolean(res.is_default),
      location: input.location,
      contact: input.contact ? { ...input.contact, houseNumber: '' } : null,
      lastUsedAt: new Date().toISOString(),
    });
  },

  updateAddress: async (
    id: string,
    input: { name?: string; address?: string; location?: GeoPoint | null; label?: AddressLabel },
  ): Promise<SavedAddress> => {
    const location = input.location;
    const address = location ? (await LegacyLocation.reverseGeocodeAsync(location))[0] : null;
    if (location && (!address?.city || !address.region || !address.postalCode)) {
      throw new Error('Could not determine the city, state and postal code for this location.');
    }
    const res = await request<any>({
      method: 'PATCH',
      url: `/customers/me/addresses/${id}`,
      data: {
        ...(input.label ? { label: input.label.toUpperCase() } : {}),
        ...(input.address ? { address_line_1: input.address } : {}),
        ...(input.name ? { landmark: input.name } : {}),
        ...(location && address
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              city: address.city,
              state: address.region,
              postal_code: address.postalCode,
            }
          : {}),
      },
    });
    return mapSavedAddress(res, {
      name:
        res.landmark ||
        (res.label && res.label !== 'OTHER' ? titleCase(res.label) : input.name || 'Address'),
      address: res.address_line_1,
      isFavorite: Boolean(res.is_default),
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: null,
    });
  },

  saveContact: async (
    id: string,
    contact: { name: string; phone: string; houseNumber: string },
  ): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'PATCH',
      url: `/customers/me/addresses/${id}`,
      data: {
        contact_name: contact.name,
        contact_phone: contact.phone,
        address_line_2: contact.houseNumber,
      },
    });
    return mapSavedAddress(res, {
      name: res.label ?? 'Address',
      address: res.address_line_1,
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: { name: contact.name, phone: contact.phone, houseNumber: contact.houseNumber },
    });
  },

  toggleFavorite: async (id: string): Promise<SavedAddress> => {
    const res = await request<any>({
      method: 'PATCH',
      url: `/customers/me/addresses/${id}`,
      data: { is_favorite: true },
    });
    return mapSavedAddress(res, {
      name: res.label ?? 'Address',
      address: res.address_line_1,
      isFavorite: true,
      location: { latitude: res.latitude, longitude: res.longitude },
      contact: null,
    });
  },

  deleteAddress: (id: string) => {
    return request<null>({ method: 'DELETE', url: `/customers/me/addresses/${id}` });
  },
};
