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
  const dropStop = res.stops?.find((s: any) => s.stop_type === 'DROP') || res.stops?.[1];

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

  const dropExecution = trip?.stops?.find((s: any) => s.stop_type === 'DROP') || trip?.stops?.[1];

  return {
    id: orderId,
    number: orderNumber,
    createdAt: res.created_at ?? res.cancelled_at ?? new Date().toISOString(),
    status,
    pickup: {
      label: pickupStop?.address_line_1 ?? input?.pickup?.label ?? 'Pickup Point',
      location: { latitude: pickupLat, longitude: pickupLng },
      houseNumber: '',
      contact: pickupStop
        ? { name: pickupStop.contact_name, phone: pickupStop.contact_phone ?? '+919876543210' }
        : (input?.pickup?.contact ?? null),
    },
    drop: {
      label: dropStop?.address_line_1 ?? input?.drop?.label ?? 'Drop Point',
      location: { latitude: dropLat, longitude: dropLng },
      houseNumber: '',
      contact: dropStop
        ? { name: dropStop.contact_name, phone: dropStop.contact_phone ?? '+919876543211' }
        : (input?.drop?.contact ?? null),
    },
    vehicle: {
      id: res.vehicle_type_id ?? 'DEV_MINI_TRUCK',
      name: 'Tata Ace / Mini Truck',
      imageKey: 'truck',
    },
    pricing: {
      fare: Number(res.quoted_amount ?? res.total_amount ?? 210.48),
      discount: Number(res.discount_amount ?? 0),
      payable: Number(res.final_amount ?? res.quoted_amount ?? res.total_amount ?? 210.48),
      couponCode: null,
      distanceKm: res.estimated_distance_meters
        ? Number((res.estimated_distance_meters / 1000).toFixed(1))
        : 15.4,
    },
    payment: {
      methodLabel: 'UPI',
      timing: res.payment_timing === 'PRE_DISPATCH' ? 'on-pickup' : 'on-delivery',
    },
    etaMinutes: res.estimated_duration_seconds ? Math.ceil(res.estimated_duration_seconds / 60) : 4,
    driverAssignAt: res.created_at ?? new Date().toISOString(),
    driver: res.assigned_driver_id
      ? {
          id: String(res.assigned_driver_id),
          name: 'Suresh Kumar',
          phone: '+919845824256',
          rating: 4.8,
          vehicleLabel: 'Tata Ace EV',
          vehiclePlate: 'DL 1A B 1234',
        }
      : null,
    pickupOtp: trip?.pickup_otp ?? '6761',
    deliveryOtp: dropExecution?.delivery_otp ?? '8589',
    route: [
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: dropLat, longitude: dropLng },
    ],
    rating: res.rating ?? null,
    cancelledAt: res.cancelled_at ?? null,
  };
}

export const ordersApi = {
  create: async (input: CreateOrderInput): Promise<Order> => {
    const quote = await catalogApi.getQuote({
      pickup: input.pickup.location,
      drop: input.drop.location,
      couponCode: input.couponCode,
    });
    const stops = [
      {
        stop_type: 'PICKUP',
        contact_name: input.pickup.contact?.name || 'Sender',
        contact_phone: input.pickup.contact?.phone || '+919876543210',
        address_line_1: input.pickup.houseNumber
          ? `${input.pickup.houseNumber}, ${input.pickup.label}`
          : input.pickup.label || 'Pickup Location',
        city: 'Dev City',
        state: 'Karnataka',
        postal_code: '560001',
        latitude: input.pickup.location?.latitude ?? 12.9716,
        longitude: input.pickup.location?.longitude ?? 77.5946,
      },
      {
        stop_type: 'DROP',
        contact_name: input.drop.contact?.name || 'Receiver',
        contact_phone: input.drop.contact?.phone || '+919876543211',
        address_line_1: input.drop.houseNumber
          ? `${input.drop.houseNumber}, ${input.drop.label}`
          : input.drop.label || 'Drop Location',
        city: 'Dev City',
        state: 'Karnataka',
        postal_code: '560034',
        latitude: input.drop.location?.latitude ?? 12.9352,
        longitude: input.drop.location?.longitude ?? 77.6245,
      },
    ];

    const res = await request<any>({
      method: 'POST',
      url: '/orders',
      headers: {
        'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data: {
        price_quote_id: (quote as any).quoteId ?? quote.options[0]?.vehicleId,
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
    const res = await request<any>({
      method: 'POST',
      url: `/orders/${id}/cancel`,
      data: { reason_code: 'CUSTOMER_CANCELLED', reason_text: 'Customer requested' },
    });
    return mapFastApiOrder(res);
  },

  rate: async (id: string, rating: number): Promise<Order> => {
    try {
      const res = await request<any>({
        method: 'POST',
        url: `/orders/${id}/rating`,
        data: { rating },
      });
      return mapFastApiOrder(res);
    } catch {
      return ordersApi.get(id);
    }
  },

  share: (id: string) => request<TrackingShare>({ method: 'POST', url: `/orders/${id}/share` }),

  /** Public: no login needed, used by the receiver's shared link. */
  getSharedTracking: (token: string, signal?: AbortSignal) =>
    request<SharedTracking>({ url: `/tracking/${token}`, signal }),
};
