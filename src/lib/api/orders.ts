import { catalogApi } from './catalog';
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
    case 'COMPLETED':
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
    case 'FAILED':
      return 'cancelled';
    default:
      return 'searching';
  }
}

function mapFastApiOrder(res: any, input?: any, tripTracking?: any): Order {
  const orderId = res.id ?? res.order_id ?? 'unknown';
  const orderNumber = res.order_number ?? `ORD-${orderId.slice(0, 8)}`;
  const pickupStop = res.stops?.find((s: any) => s.stop_type === 'PICKUP') || res.stops?.[0];
  // The final drop; a multi-stop order has earlier DROP stops before it.
  const dropStop = res.stops?.findLast((s: any) => s.stop_type === 'DROP') || res.stops?.[1];

  const trip = tripTracking?.trip;
  const status = trip ? mapFastApiStatus(trip.status) : mapFastApiStatus(res.status);

  const pickupLat = pickupStop
    ? Number(pickupStop.latitude)
    : (input?.pickup?.location?.latitude ?? 28.628);
  const pickupLng = pickupStop
    ? Number(pickupStop.longitude)
    : (input?.pickup?.location?.longitude ?? 77.2405);
  const dropLat = dropStop
    ? Number(dropStop.latitude)
    : (input?.drop?.location?.latitude ?? 28.7159);
  const dropLng = dropStop
    ? Number(dropStop.longitude)
    : (input?.drop?.location?.longitude ?? 77.1723);

  // Multi-stop: the code to show is for the next delivery stop not yet completed.
  const dropExecutions = ((trip?.stops ?? []) as any[]).filter((s) => s.stop_type === 'DROP');
  const dropExecution =
    dropExecutions.find((s) => s.status !== 'COMPLETED') ?? dropExecutions.at(-1);

  return {
    id: orderId,
    number: orderNumber,
    createdAt: res.created_at ?? res.cancelled_at ?? new Date().toISOString(),
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
      id: res.vehicle_type_id ?? 'DEV_MINI_TRUCK',
      name: res.vehicle_type_name ?? res.vehicle?.type_name ?? '',
      imageUrl: res.vehicle?.image_url ?? null,
    },
    pricing: {
      fare: Number(res.quoted_amount ?? res.total_amount ?? 0),
      discount: Number(res.discount_amount ?? 0),
      payable: Number(res.final_amount ?? res.quoted_amount ?? res.total_amount ?? 0),
      couponCode: null,
      distanceKm: res.estimated_distance_meters
        ? Number((res.estimated_distance_meters / 1000).toFixed(1))
        : 15.4,
    },
    payment: {
      methodLabel: res.payment_method ?? 'Cash',
      timing: res.payment_timing === 'PRE_DISPATCH' ? 'on-pickup' : 'on-delivery',
    },
    etaMinutes: res.estimated_duration_seconds
      ? Math.ceil(res.estimated_duration_seconds / 60)
      : null,
    driverAssignAt: res.created_at ?? new Date().toISOString(),
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
    noDriverFound: !trip && res.status === 'NO_DRIVER_FOUND',
    driverLocation: tripTracking?.driver_location
      ? {
          latitude: Number(tripTracking.driver_location.latitude),
          longitude: Number(tripTracking.driver_location.longitude),
        }
      : null,
    rating: res.rating ?? null,
    cancelledAt: res.cancelled_at ?? null,
  };
}

export const ordersApi = {
  create: async (input: CreateOrderInput): Promise<Order> => {
    const quote = await catalogApi.getQuote({
      pickup: input.pickup.location,
      drop: input.drop.location,
      via: (input.stops ?? []).flatMap((stop) => (stop.location ? [stop.location] : [])),
      couponCode: input.couponCode,
    });
    const toStop = (stopType: 'PICKUP' | 'DROP', stop: CreateOrderInput['pickup']) => {
      const who = stopType === 'PICKUP' ? 'sender' : 'receiver';
      // The driver calls this person: a made-up name or number is never sent.
      if (!stop.contact?.name || !stop.contact.phone) {
        throw new Error(`Add the ${who}'s name and mobile number for "${stop.label}".`);
      }
      if (!stop.location) throw new Error(`Choose the location for "${stop.label}" again.`);
      return toStopPayload(stopType, stop, stop.contact, stop.location);
    };
    const toStopPayload = (
      stopType: 'PICKUP' | 'DROP',
      stop: CreateOrderInput['pickup'],
      contact: { name: string; phone: string },
      location: { latitude: number; longitude: number },
    ) => ({
      stop_type: stopType,
      contact_name: contact.name,
      contact_phone: contact.phone.startsWith('+') ? contact.phone : `+91${contact.phone}`,
      address_line_1: stop.houseNumber ? `${stop.houseNumber}, ${stop.label}` : stop.label,
      city: 'Dev City',
      state: 'Karnataka',
      postal_code: stopType === 'PICKUP' ? '560001' : '560034',
      latitude: location.latitude,
      longitude: location.longitude,
    });
    const stops = [
      toStop('PICKUP', input.pickup),
      ...(input.stops ?? []).map((stop) => toStop('DROP', stop)),
      toStop('DROP', input.drop),
    ];

    const res = await request<any>({
      method: 'POST',
      url: '/orders',
      headers: {
        'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data: {
        price_quote_id: (
          quote.options.find((o) => o.vehicleId === input.vehicleId) ?? quote.options[0]
        )?.quoteId,
        stops,
        items: [{ description: 'General Cargo', category: 'BOX', quantity: 1 }],
      },
    });

    return mapFastApiOrder(res, input);
  },

  list: async (signal?: AbortSignal): Promise<Order[]> => {
    const res = await request<any>({ url: '/orders', signal });
    const items = Array.isArray(res) ? res : (res.items ?? []);
    return items.map((o: any) => mapFastApiOrder(o));
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

  share: (id: string) => request<TrackingShare>({ method: 'POST', url: `/orders/${id}/share` }),

  /** Public: no login needed, used by the receiver's shared link. */
  getSharedTracking: (token: string, signal?: AbortSignal) =>
    request<SharedTracking>({ url: `/tracking/${token}`, signal }),
};
