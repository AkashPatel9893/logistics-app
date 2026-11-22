import type { GeoPoint } from '@/lib/geo';
import type { Href } from '@/lib/navigation';

export type MapPickerMode =
  | { mode: 'pin'; stopIndex?: number }
  | {
      mode: 'confirm';
      kind: 'pickup' | 'drop';
      addressId?: string;
      region?: GeoPoint | null;
      stopIndex?: number;
      returnTo?: 'home' | 'add-stops';
    }
  | { mode: 'edit'; addressId: string; name: string; address: string; region?: GeoPoint | null };

export interface MapPickerParams {
  target?: 'confirm' | 'edit';
  addressKind?: 'pickup';
  addressId?: string;
  stopIndex?: string;
  returnHome?: '1';
  returnTo?: 'home' | 'add-stops';
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
  const stopParams =
    options.mode !== 'edit' && options.stopIndex !== undefined
      ? { stopIndex: String(options.stopIndex) }
      : {};
  if (options.mode === 'pin') return { pathname: '/select-location-map', params: stopParams };

  const params: MapPickerParams =
    options.mode === 'confirm'
      ? {
          target: 'confirm',
          ...(options.kind === 'pickup' ? { addressKind: 'pickup' } : {}),
          ...(options.addressId ? { addressId: options.addressId } : {}),
          ...(options.returnTo ? { returnTo: options.returnTo } : {}),
          ...stopParams,
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

export function parseMapPickerParams(raw: RawSearchParams): MapPickerMode {
  const params = toMapPickerParams(raw);
  const region =
    params.lat && params.lng
      ? { latitude: Number(params.lat), longitude: Number(params.lng) }
      : null;

  const stopIndex = params.stopIndex !== undefined ? Number(params.stopIndex) : undefined;

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
    const returnTo =
      params.returnTo === 'home' || params.returnTo === 'add-stops'
        ? params.returnTo
        : params.returnHome === '1'
          ? 'home'
          : undefined;
    return {
      mode: 'confirm',
      kind: params.addressKind === 'pickup' ? 'pickup' : 'drop',
      addressId: params.addressId,
      region,
      stopIndex,
      returnTo,
    };
  }
  return { mode: 'pin', stopIndex };
}
