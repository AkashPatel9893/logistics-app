import * as Location from 'expo-location';

import { getUser } from '@/lib/auth/utils';
import { storage } from '@/lib/storage';

import { catalogApi } from './catalog';
import { ApiError } from './api-error';
import { request } from './client';
import type { CreateOrderInput, Order, OrderStatus, SharedTracking, TrackingShare } from './models';

function mapFastApiStatus(status: string): OrderStatus {
  switch (status) {
    case 'PENDING':
    case 'CREATED':
    case 'PAYMENT_PENDING':
    case 'SEARCHING_DRIVER':
    case 'DISPATCHING':
    case 'SEARCHING':
      return 'searching';
    case 'ASSIGNED':
    case 'DRIVER_ASSIGNED':
    case 'DRIVER_EN_ROUTE_TO_PICKUP':
    case 'EN_ROUTE_PICKUP':
      return 'heading_to_pickup';
    case 'ARRIVED_PICKUP':
    case 'ARRIVED_AT_PICKUP':
    case 'PICKUP_IN_PROGRESS':
    case 'DRIVER_ARRIVED_AT_PICKUP':
      return 'arrived_at_pickup';
    case 'IN_TRANSIT':
    case 'PICKED_UP':
    case 'STOP_SERVICE_IN_PROGRESS':
    case 'STOP_COMPLETED':
      return 'pickup_complete';
    case 'ARRIVED_DROP':
    case 'ARRIVED_AT_STOP':
    case 'ARRIVED_AT_FINAL_DESTINATION':
    case 'DELIVERY_IN_PROGRESS':
    case 'DRIVER_ARRIVED_AT_DROP':
      return 'arrived_at_drop';
    case 'AWAITING_PAYMENT':
      return 'awaiting_payment';
    case 'PAYMENT_FAILED':
      return 'payment_failed';
    case 'DELIVERY_FAILED':
    case 'FAILED':
      return 'delivery_failed';
    case 'NO_DRIVER_FOUND':
      return 'searching';
    case 'COMPLETED':
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

function optionalAmount(value: unknown): number | null {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return null;
  return Number(value);
}

function mapFastApiOrder(res: any, input?: any, tripTracking?: any): Order {
  const orderId = res.id ?? res.order_id ?? 'unknown';
  const orderNumber = res.order_number ?? `ORD-${orderId.slice(0, 8)}`;
  const pickupStop = res.stops?.find((s: any) => s.stop_type === 'PICKUP') || res.stops?.[0];
  // The final drop; a multi-stop order has earlier DROP stops before it.
  const dropStop = res.stops?.findLast((s: any) => s.stop_type === 'DROP') || res.stops?.[1];

  const trip = tripTracking?.trip;
  const status = trip ? mapFastApiStatus(trip.status) : mapFastApiStatus(res.status);

  const pickupLat = pickupStop ? Number(pickupStop.latitude) : input?.pickup?.location?.latitude;
  const pickupLng = pickupStop ? Number(pickupStop.longitude) : input?.pickup?.location?.longitude;
  const dropLat = dropStop ? Number(dropStop.latitude) : input?.drop?.location?.latitude;
  const dropLng = dropStop ? Number(dropStop.longitude) : input?.drop?.location?.longitude;
  if (![pickupLat, pickupLng, dropLat, dropLng].every(Number.isFinite)) {
    throw new ApiError('Order locations are unavailable. Please try again.', 'unknown');
  }

  // Multi-stop: the code to show is for the next delivery stop not yet completed.
  const dropExecutions = ((trip?.stops ?? []) as any[]).filter((s) => s.stop_type === 'DROP');
  const dropExecution =
    dropExecutions.find((s) => s.status !== 'COMPLETED') ?? dropExecutions.at(-1);

  return {
    id: orderId,
    number: orderNumber,
    createdAt: res.created_at ?? null,
    tripId: res.active_trip_id ?? trip?.id ?? null,
    status,
    pickup: {
      label: pickupStop?.address_line_1 ?? input?.pickup?.label ?? '',
      location: { latitude: pickupLat, longitude: pickupLng },
      houseNumber: '',
      contact: pickupStop
        ? { name: pickupStop.contact_name, phone: pickupStop.contact_phone ?? '' }
        : (input?.pickup?.contact ?? null),
    },
    drop: {
      label: dropStop?.address_line_1 ?? input?.drop?.label ?? '',
      location: { latitude: dropLat, longitude: dropLng },
      houseNumber: '',
      contact: dropStop
        ? { name: dropStop.contact_name, phone: dropStop.contact_phone ?? '' }
        : (input?.drop?.contact ?? null),
    },
    vehicle: {
      id: res.vehicle_type_id ?? '',
      name: res.vehicle_type_name ?? res.vehicle?.type_name ?? '',
      imageUrl: res.vehicle?.image_url ?? null,
    },
    pricing: {
      fare: optionalAmount(res.quoted_amount ?? res.total_amount),
      discount: optionalAmount(res.discount_amount),
      payable: optionalAmount(res.final_amount ?? res.quoted_amount ?? res.total_amount),
      couponCode: null,
      distanceKm: res.estimated_distance_meters
        ? Number((res.estimated_distance_meters / 1000).toFixed(1))
        : null,
    },
    payment: {
      methodLabel: res.payment?.method ?? res.payment?.paid_via ?? res.payment_method ?? '—',
      status: res.payment?.status ?? null,
      timing:
        res.payment_timing === 'PRE_DISPATCH'
          ? 'on-pickup'
          : res.payment_timing === 'POST_DELIVERY'
            ? 'on-delivery'
            : null,
    },
    etaMinutes: res.estimated_duration_seconds
      ? Math.ceil(res.estimated_duration_seconds / 60)
      : null,
    driverAssignAt: res.created_at ?? null,
    // The backend sends only the driver's id today; nothing else is known, so nothing else is shown.
    driver: res.assigned_driver_id
      ? {
          id: String(res.assigned_driver_id),
          name: res.driver?.name ?? '',
          phone: res.driver?.phone ?? null,
          rating: res.driver?.rating ?? null,
          vehicleLabel: res.vehicle?.model ?? '',
          vehiclePlate: res.vehicle?.registration_number ?? '',
        }
      : null,
    // Empty until a driver is assigned — never a made-up code.
    pickupOtp: trip?.pickup_otp ?? '',
    deliveryOtp: dropExecution?.delivery_otp ?? '',
    route: [
      { latitude: pickupLat, longitude: pickupLng },
      // Stops between pickup and the final drop, so the map draws through them.
      ...((res.stops ?? []) as any[])
        .filter((s) => s !== pickupStop && s !== dropStop)
        .map((s) => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) })),
      { latitude: dropLat, longitude: dropLng },
    ],
    stops: ((res.stops ?? []) as any[])
      .filter((s) => s.stop_type === 'DROP')
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .map((s, index) => {
        const execution = dropExecutions.find(
          (e) => e.order_stop_id === s.id || e.sequence_number === s.sequence_number,
        );
        return {
          id: String(s.id ?? ''),
          number: index + 1,
          label: s.address_line_1 ?? '',
          contactName: s.contact_name ?? '',
          status:
            execution?.status === 'COMPLETED'
              ? ('completed' as const)
              : execution?.status === 'ARRIVED' || execution?.status === 'IN_SERVICE'
                ? ('arrived' as const)
                : ('pending' as const),
          code: execution?.delivery_otp ?? '',
        };
      }),
    noDriverFound: !trip && res.status === 'NO_DRIVER_FOUND',
    driverLocation: tripTracking?.driver_location
      ? {
          latitude: Number(tripTracking.driver_location.latitude),
          longitude: Number(tripTracking.driver_location.longitude),
        }
      : null,
    driverLocationRecordedAt: tripTracking?.driver_location?.recorded_at ?? null,
    driverLocationStale: tripTracking?.driver_location?.stale ?? true,
    liveEta: tripTracking?.eta
      ? {
          seconds: Number(tripTracking.eta.eta_seconds),
          meters: Number(tripTracking.eta.distance_meters),
          toPickup: tripTracking.eta.target_stop_sequence === pickupStop?.sequence_number,
        }
      : null,
    rating: res.rating ?? null,
    cancelledAt: res.cancelled_at ?? null,
  };
}

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

let creatingOrder = false;

/** The area a driver may see before accepting: the place name, else the geocoded locality or street. */
function areaLabel(label: string, address: Location.LocationGeocodedAddress): string | undefined {
  const isGeneric = /^(pinned|pin|current) location$/i.test(label.trim());
  const area =
    (isGeneric ? null : label) || address.district || address.street || address.subregion;
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
      const inputJson = JSON.stringify(input);
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
      const quote = await catalogApi.getQuote({
        pickup: input.pickup.location,
        drop: input.drop.location,
        via: (input.stops ?? []).flatMap((stop) => (stop.location ? [stop.location] : [])),
        couponCode: input.couponCode,
      });
      const toStop = async (stopType: 'PICKUP' | 'DROP', stop: CreateOrderInput['pickup']) => {
        const who = stopType === 'PICKUP' ? 'sender' : 'receiver';
        // The driver calls this person: a made-up name or number is never sent.
        if (!stop.contact?.name || !stop.contact.phone) {
          throw new Error(`Add the ${who}'s name and mobile number for "${stop.label}".`);
        }
        if (!stop.location) throw new Error(`Choose the location for "${stop.label}" again.`);
        const [address] = await Location.reverseGeocodeAsync(stop.location);
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
        address: Location.LocationGeocodedAddress,
      ) => ({
        stop_type: stopType,
        contact_name: contact.name,
        contact_phone: contact.phone.startsWith('+') ? contact.phone : `+91${contact.phone}`,
        address_line_1: stop.houseNumber ? `${stop.houseNumber}, ${stop.label}` : stop.label,
        // Locality or street name only, never a house number: drivers see it on the offer.
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

      // The fare the customer agreed to belongs to this vehicle: never book a different one.
      const chosenQuote = quote.options.find((o) => o.vehicleId === input.vehicleId);
      if (!chosenQuote) throw new Error('This vehicle is no longer available. Choose another.');

      const next: PendingOrder = {
        input: inputJson,
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`,
        data: {
          price_quote_id: chosenQuote.quoteId,
          stops,
          items: [{ description: 'General Cargo', category: 'BOX', quantity: 1 }],
        },
      };
      storage.set(storageKey, JSON.stringify(next));
      return await submitPendingOrder(storageKey, next, input);
    } finally {
      creatingOrder = false;
    }
  },

  list: async (signal?: AbortSignal): Promise<Order[]> => {
    const res = await request<any>({ url: '/orders', signal });
    const items = Array.isArray(res) ? res : (res.items ?? []);
    return items.map((o: any) => mapFastApiOrder(o));
  },

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

  cancel: async (id: string): Promise<Order> => {
    await request<any>({
      method: 'POST',
      url: `/orders/${id}/cancel`,
      data: { reason_code: 'CUSTOMER_CANCELLED', reason_text: 'Customer requested' },
    });
    // The cancel response is a summary; re-read the order so its number and fare stay shown.
    return ordersApi.get(id);
  },

  /** Throws when the rating wasn't stored — the UI must not thank the user for it. */
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

  /** Public: no login needed, used by the receiver's shared link. */
  getSharedTracking: (token: string, signal?: AbortSignal) =>
    request<SharedTracking>({ url: `/tracking/${token}`, signal }),
};
