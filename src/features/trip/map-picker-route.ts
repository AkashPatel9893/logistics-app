import type { Href } from 'expo-router';

import type { GeoPoint } from '@/lib/geo';

/**
 * Typed params for `/select-location-map`. Every screen that opens the map
 * picker builds its route here, so the param contract lives in one place.
 */
export type MapPickerMode =
  /** Drag the map to pin a new drop location. */
  | { mode: 'pin' }
  /** Confirm a place picked from search/recents, then add contact details. */
  | { mode: 'confirm'; kind: 'pickup' | 'drop'; addressId?: string; region?: GeoPoint | null }
  /** Edit a saved address's label and location. */
  | { mode: 'edit'; addressId: string; name: string; address: string; region?: GeoPoint | null };

export interface MapPickerParams {
  target?: 'confirm' | 'edit';
  addressKind?: 'pickup';
  addressId?: string;
  editName?: string;
  editAddress?: string;
  lat?: string;
  lng?: string;
  [key: string]: string | undefined;
}

function regionParams(region: GeoPoint | null | undefined) {
  return region ? { lat: String(region.latitude), lng: String(region.longitude) } : {};
}

export function mapPickerHref(options: MapPickerMode): Href {
  if (options.mode === 'pin') return '/select-location-map';

  const params: MapPickerParams =
    options.mode === 'confirm'
      ? {
          target: 'confirm',
          ...(options.kind === 'pickup' ? { addressKind: 'pickup' } : {}),
          ...(options.addressId ? { addressId: options.addressId } : {}),
          ...regionParams(options.region),
        }
      : {
          target: 'edit',
          addressId: options.addressId,
          editName: options.name,
          editAddress: options.address,
          ...regionParams(options.region),
        };

  return { pathname: '/select-location-map', params };
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function toMapPickerParams(raw: RawSearchParams): MapPickerParams {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  ) as MapPickerParams;
}

/** Parses the map picker's route params back into a mode. */
export function parseMapPickerParams(raw: RawSearchParams): MapPickerMode {
  const params = toMapPickerParams(raw);
  const region =
    params.lat && params.lng
      ? { latitude: Number(params.lat), longitude: Number(params.lng) }
      : null;

  if (params.target === 'edit' && params.addressId) {
    return {
      mode: 'edit',
      addressId: params.addressId,
      name: params.editName ?? '',
      address: params.editAddress ?? '',
      region,
    };
  }
  if (params.target === 'confirm') {
    return {
      mode: 'confirm',
      kind: params.addressKind === 'pickup' ? 'pickup' : 'drop',
      addressId: params.addressId,
      region,
    };
  }
  return { mode: 'pin' };
}
