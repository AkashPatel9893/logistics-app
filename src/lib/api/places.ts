import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { env } from '@/env';
import { getUser } from '../auth/utils';
import { request } from './client';
import type { AddressLabel, GeoPoint, Place, SavedAddress } from './models';

export interface SaveAddressInput {
  name: string;
  address: string;
  location: GeoPoint | null;
  /** The customer's own name for a custom ("Other") place. */
  customName?: string;
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
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

/** Identifies the app to Google when the key is restricted to it (same rule as route requests). */
const APP_HEADERS: Record<string, string> =
  Platform.OS === 'ios' && Constants.expoConfig?.ios?.bundleIdentifier
    ? { 'X-Ios-Bundle-Identifier': Constants.expoConfig.ios.bundleIdentifier }
    : {};

/**
 * One billing session spans the typing and the final pick: every autocomplete request reuses this
 * token and the details call that ends the session consumes it, which is Google's cheapest pricing.
 */
let sessionToken = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const newSessionToken = () => {
  sessionToken = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

export const placesApi = {
  /** Place suggestions from Google Places (New), nearest to `near` first and limited to India. */
  search: async (q: string, signal?: AbortSignal, near?: GeoPoint | null): Promise<Place[]> => {
    if (GOOGLE_API_KEY) {
      try {
        const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            ...APP_HEADERS,
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
                // Coordinates come from the details call when the customer picks one.
                location: null,
              },
            ];
          });
          if (places.length > 0) return places;
        }
      } catch {
        // Fall back to backend search
      }
    }

    // 2. Fall back to backend places autocomplete
    try {
      const sessionToken = `session-${Date.now()}`;
      const params: Record<string, string | number> = { q, session_token: sessionToken };
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
    } catch {
      // Ignored
    }

    return [];
  },

  /** The coordinates of a suggestion picked from `search`; ends the billing session. */
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
            ...APP_HEADERS,
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
    if (!input.location) throw new Error('Choose a location before saving this address.');
    const [address] = await Location.reverseGeocodeAsync(input.location);
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
    return {
      id: res.id,
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
    };
  },

  updateAddress: async (
    id: string,
    input: { name?: string; address?: string; location?: GeoPoint | null; label?: AddressLabel },
  ): Promise<SavedAddress> => {
    const location = input.location;
    const address = location ? (await Location.reverseGeocodeAsync(location))[0] : null;
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
    return {
      id: res.id,
      name:
        res.landmark ||
        (res.label && res.label !== 'OTHER' ? titleCase(res.label) : input.name || 'Address'),
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
      method: 'PATCH',
      url: `/customers/me/addresses/${id}`,
      data: {
        contact_name: contact.name,
        contact_phone: contact.phone,
        address_line_2: contact.houseNumber,
      },
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
      method: 'PATCH',
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
