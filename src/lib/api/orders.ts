import { File, Paths } from 'expo-file-system';

import { API_BASE_URL } from '@/config/env';
import { getToken, getUser } from '@/lib/auth/utils';
import { LegacyLocation, type LocationGeocodedAddress } from '@/lib/location';
import { storage } from '@/lib/storage';

import { ApiError } from './api-error';
import { catalogApi } from './catalog';
import { request } from './client';
import type { CreateOrderInput, Order, SharedTracking, TrackingShare } from './models';
import { mapFastApiOrder } from './order-mapper';

type PendingOrder = { input: string; key: string; data: unknown };

async function submitPendingOrder(
  storageKey: string,
  pending: PendingOrder,
  input: CreateOrderInput,
): Promise<Order> {
  try {
    const res = await request<any>({
      method: 'POST',
      url: '/orders',
      headers: { 'Idempotency-Key': pending.key },
      data: pending.data,
    });
    storage.remove(storageKey);
    return mapFastApiOrder(res, input);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status !== null &&
      error.status >= 400 &&
      error.status < 500 &&
      ![408, 409, 429].includes(error.status)
    ) {
      storage.remove(storageKey);
    }
    throw error;
  }
}

const TIP_ERRORS: Record<string, string> = {
  TIP_NOT_ALLOWED_NOW: 'Tips can only be added while we are finding a driver.',
  TIP_NOT_AVAILABLE: 'Tips are not available for this order.',
  INVALID_TIP_AMOUNT: 'That tip amount is not allowed.',
  TIP_LIMIT_EXCEEDED: 'You have reached the most you can tip on this order.',
};

const STALE_QUOTE_CODES = new Set(['QUOTE_EXPIRED', 'QUOTE_NOT_FOUND', 'QUOTE_ROUTE_MISMATCH']);

let creatingOrder = false;

function addressLine(stop: CreateOrderInput['pickup']): string {
  const street = stop.street?.trim() || stop.label;
  const line = stop.houseNumber ? `${stop.houseNumber}, ${street}` : street;
  return line.slice(0, 255);
}

const HOUSE_NUMBER_SEGMENT = /^#?\d[\w/-]{0,5}$/;

function withoutHouseNumber(label: string): string {
  const parts = label.split(',').map((part) => part.trim());
  while (parts.length > 1 && HOUSE_NUMBER_SEGMENT.test(parts[0] ?? '')) parts.shift();
  return parts.filter(Boolean).join(', ');
}

function areaLabel(label: string, address: LocationGeocodedAddress): string | undefined {
  const cleaned = withoutHouseNumber(label);
  const isGeneric = /^(pinned|pin|current) location$/i.test(cleaned);
  const area =
    (isGeneric ? null : cleaned) || address.district || address.street || address.subregion;
  return area?.trim().slice(0, 120) || undefined;
}

export const ordersApi = {
  create: async (input: CreateOrderInput): Promise<Order> => {
    if (creatingOrder)
      throw new ApiError('A booking is already being placed. Please wait.', 'unknown');
    creatingOrder = true;
    try {
      const user = getUser();
      if (!user?.id) throw new ApiError('Please sign in again before booking.', 'unknown');
      const storageKey = `pending_order:${user.id}`;
      const inputJson = JSON.stringify({ ...input, quoteId: undefined });
      const saved = storage.getString(storageKey);
      const pending = saved ? (JSON.parse(saved) as PendingOrder) : null;
      if (pending) {
        if (pending.input !== inputJson)
          throw new ApiError(
            'A previous booking has an unknown status. Retry that booking or contact support before placing another.',
            'unknown',
          );
        return await submitPendingOrder(storageKey, pending, input);
      }
      const toStop = async (stopType: 'PICKUP' | 'DROP', stop: CreateOrderInput['pickup']) => {
        const who = stopType === 'PICKUP' ? 'sender' : 'receiver';
        if (!stop.contact?.name || !stop.contact.phone) {
          throw new Error(`Add the ${who}'s name and mobile number for "${stop.label}".`);
        }
        if (!stop.location) throw new Error(`Choose the location for "${stop.label}" again.`);
        const [address] = await LegacyLocation.reverseGeocodeAsync(stop.location);
        if (!address?.city || !address.region || !address.postalCode) {
          throw new ApiError(
            `Could not determine the city, state and postal code for "${stop.label}". Choose the location again.`,
            'unknown',
          );
        }
        return toStopPayload(stopType, stop, stop.contact, stop.location, address);
      };
      const toStopPayload = (
        stopType: 'PICKUP' | 'DROP',
        stop: CreateOrderInput['pickup'],
        contact: { name: string; phone: string },
        location: { latitude: number; longitude: number },
        address: LocationGeocodedAddress,
      ) => ({
        stop_type: stopType,
        contact_name: contact.name,
        contact_phone: contact.phone.startsWith('+') ? contact.phone : `+91${contact.phone}`,
        address_line_1: addressLine(stop),
        area_label: areaLabel(stop.label, address),
        city: address.city,
        state: address.region,
        postal_code: address.postalCode,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const stops = await Promise.all([
        toStop('PICKUP', input.pickup),
        ...(input.stops ?? []).map((stop) => toStop('DROP', stop)),
        toStop('DROP', input.drop),
      ]);

      const requote = async () => {
        const quote = await catalogApi.getQuote({
          pickup: input.pickup.location,
          drop: input.drop.location,
          via: (input.stops ?? []).flatMap((stop) => (stop.location ? [stop.location] : [])),
          couponCode: input.couponCode,
          priority: input.priority,
        });
        const chosen = quote.options.find((o) => o.vehicleId === input.vehicleId);
        if (!chosen) throw new Error('This vehicle is no longer available. Choose another.');
        return chosen.quoteId;
      };

      const place = async (priceQuoteId: string): Promise<Order> => {
        const next: PendingOrder = {
          input: inputJson,
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`,
          data: {
            price_quote_id: priceQuoteId,
            stops,
            items: [
              input.goods
                ? {
                    description: input.goods.description,
                    category: input.goods.category,
                    quantity: 1,
                  }
                : { description: 'General Cargo', category: 'BOX', quantity: 1 },
            ],
          },
        };
        storage.set(storageKey, JSON.stringify(next));
        return await submitPendingOrder(storageKey, next, input);
      };

      if (!input.quoteId) return await place(await requote());
      try {
        return await place(input.quoteId);
      } catch (error) {
        if (error instanceof ApiError && error.code && STALE_QUOTE_CODES.has(error.code)) {
          return await place(await requote());
        }
        throw error;
      }
    } finally {
      creatingOrder = false;
    }
  },

  list: async (signal?: AbortSignal): Promise<Order[]> =>
    (await ordersApi.listPage(null, signal)).items,

  listPage: async (
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<{ items: Order[]; nextCursor: string | null }> => {
    const res = await request<any>({
      url: '/orders',
      params: cursor ? { cursor } : undefined,
      signal,
    });
    return {
      items: (Array.isArray(res) ? res : (res.items ?? [])).map((o: any) => mapFastApiOrder(o)),
      nextCursor: res.next_cursor ?? null,
    };
  },

  get: async (id: string, signal?: AbortSignal): Promise<Order> => {
    const res = await request<any>({ url: `/orders/${id}`, signal });
    let tripTracking: any = null;
    if (res.active_trip_id) {
      try {
        tripTracking = await request<any>({ url: `/trips/${res.active_trip_id}/tracking`, signal });
      } catch {}
    }
    return mapFastApiOrder(res, undefined, tripTracking);
  },

  cancel: async ({
    id,
    reasonCode,
    reasonText,
  }: {
    id: string;
    reasonCode: string;
    reasonText?: string;
  }): Promise<Order> => {
    await request<any>({
      method: 'POST',
      url: `/orders/${id}/cancel`,
      data: { reason_code: reasonCode, reason_text: reasonText?.trim() || null },
    });
    return ordersApi.get(id);
  },

  rate: async (id: string, rating: number): Promise<Order> => {
    await request<any>({ method: 'POST', url: `/orders/${id}/rating`, data: { rating } });
    return { ...(await ordersApi.get(id)), rating };
  },

  share: ({ id, stopId }: { id: string; stopId?: string }) =>
    request<TrackingShare>({
      method: 'POST',
      url: `/orders/${id}/share`,
      data: stopId ? { stop_id: stopId } : {},
    }),

  invoice: (id: string, signal?: AbortSignal) =>
    request<{
      invoice_number: string;
      total_amount: string;
      currency: string;
      status: string;
      lines: { line_number: number; description: string; total: string }[];
    }>({ url: `/orders/${id}/invoice`, signal }),

  /** Adds to the tip while the order is searching for a driver. Each tap is its own request (own key). */
  addTip: async ({ id, amount }: { id: string; amount: number }): Promise<void> => {
    try {
      await request<any>({
        method: 'POST',
        url: `/orders/${id}/tips`,
        headers: {
          'Idempotency-Key': `tip-${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`,
        },
        data: { amount: amount.toFixed(2) },
      });
    } catch (error) {
      if (error instanceof ApiError && error.code && TIP_ERRORS[error.code]) {
        throw new ApiError(TIP_ERRORS[error.code], error.kind, error.status, error.code);
      }
      throw error;
    }
  },

  /** Downloads the invoice PDF (it needs the sign-in header) and opens it in the system viewer. */
  openInvoicePdf: async (id: string): Promise<void> => {
    const token = getToken()?.accessToken;
    if (!token) throw new ApiError('Please sign in again.', 'unknown');
    const file = await File.downloadFileAsync(
      `${API_BASE_URL.replace(/\/+$/, '')}/orders/${id}/invoice/pdf`,
      new File(Paths.cache, `invoice-${id}.pdf`),
      {
        headers: { Authorization: `Bearer ${token}`, 'X-Client-App': 'customer' },
        idempotent: true,
      },
    ).catch((error: unknown) => {
      const message = String((error as Error)?.message ?? '');
      if (/404/.test(message))
        throw new ApiError("The invoice isn't ready yet. Try again in a minute.", 'unknown');
      throw new ApiError('Could not download the invoice. Check your connection.', 'unknown');
    });
    await file.preview();
  },

  getSharedTracking: (token: string, signal?: AbortSignal) =>
    request<SharedTracking>({ url: `/tracking/${token}`, signal }),
};
