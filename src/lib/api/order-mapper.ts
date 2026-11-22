import { ApiError } from './api-error';
import type { Order, OrderStatus, SharedTracking } from './models';

export function mapFastApiStatus(status: string): OrderStatus {
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

export function mapFastApiOrder(res: any, input?: any, tripTracking?: any): Order {
  const orderId = res.id ?? res.order_id ?? 'unknown';
  const orderNumber = res.order_number ?? `ORD-${orderId.slice(0, 8)}`;
  const pickupStop = res.stops?.find((s: any) => s.stop_type === 'PICKUP') || res.stops?.[0];
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
      contact:
        pickupStop?.contact_name || pickupStop?.contact_phone
          ? { name: pickupStop.contact_name ?? '', phone: pickupStop.contact_phone ?? '' }
          : (input?.pickup?.contact ?? null),
    },
    drop: {
      label: dropStop?.address_line_1 ?? input?.drop?.label ?? '',
      location: { latitude: dropLat, longitude: dropLng },
      houseNumber: '',
      contact:
        dropStop?.contact_name || dropStop?.contact_phone
          ? { name: dropStop.contact_name ?? '', phone: dropStop.contact_phone ?? '' }
          : (input?.drop?.contact ?? null),
    },
    isPriority: Boolean(res.is_priority),
    tipTotal: Number(res.tip_total ?? 0) || 0,
    tipOptions:
      res.tip_options && Array.isArray(res.tip_options.amounts)
        ? {
            amounts: res.tip_options.amounts.map(Number).filter(Number.isFinite),
            maxTotal: Number(res.tip_options.max_total) || 0,
            remaining: Number(res.tip_options.remaining) || 0,
          }
        : null,
    vehicle: {
      id: res.vehicle_type_id ?? '',
      name: res.vehicle_type_name ?? res.vehicle?.type_name ?? '',
      code: res.vehicle?.type_code ?? res.vehicle_type_code ?? null,
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
    pickupOtp: trip?.pickup_otp ?? '',
    deliveryOtp: dropExecution?.delivery_otp ?? '',
    route: [
      { latitude: pickupLat, longitude: pickupLng },
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
          contactPhone: s.contact_phone ?? '',
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
          computedAt: Number.isFinite(Date.parse(tripTracking.eta.computed_at))
            ? Date.parse(tripTracking.eta.computed_at)
            : null,
        }
      : null,
    rating: res.rating ?? null,
    cancelledAt: res.cancelled_at ?? null,
    cancellationFee:
      res.cancellation?.fee_amount != null ? Number(res.cancellation.fee_amount) : null,
  };
}

function toGeoPoint(point: any): { latitude: number; longitude: number } | null {
  if (!point) return null;
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function mapFastApiSharedTracking(res: any): SharedTracking {
  const status = mapFastApiStatus(String(res?.status ?? ''));
  const view = res?.view === 'DELIVERED' || status === 'delivered' ? 'DELIVERED' : 'ACTIVE';
  const rawDriverLocation = toGeoPoint(res?.driver_location);
  const rawEtaSeconds = res?.eta?.eta_seconds != null ? Number(res.eta.eta_seconds) : null;
  const etaMinutes =
    rawEtaSeconds != null && Number.isFinite(rawEtaSeconds)
      ? Math.max(1, Math.ceil(rawEtaSeconds / 60))
      : typeof res?.eta_minutes === 'number'
        ? res.eta_minutes
        : null;

  const vehicleName = String(
    res?.vehicle?.type_name ?? res?.vehicle_name ?? res?.vehicleName ?? '',
  );
  const driver = res?.driver
    ? {
        name: String(res.driver.name ?? ''),
        rating: res.driver.rating != null ? Number(res.driver.rating) : null,
        phone: res.driver.phone ?? null,
        vehicleLabel: String(res.driver.vehicle_label ?? res.driver.vehicleLabel ?? ''),
        vehiclePlate: String(res.driver.vehicle_plate ?? res.driver.vehiclePlate ?? ''),
      }
    : res?.vehicle
      ? {
          name: vehicleName || 'Driver',
          rating: null,
          phone: null,
          vehicleLabel: String(res.vehicle.model ?? ''),
          vehiclePlate: String(res.vehicle.registration_number ?? ''),
        }
      : null;

  const route = Array.isArray(res?.route)
    ? res.route
        .map(toGeoPoint)
        .filter(
          (
            p: { latitude: number; longitude: number } | null,
          ): p is { latitude: number; longitude: number } => p !== null,
        )
    : [];

  return {
    view,
    orderNumber: String(res?.order_number ?? res?.orderNumber ?? ''),
    status,
    senderName: String(res?.sender_name ?? res?.senderName ?? 'Someone'),
    pickupLabel: res?.pickup_label ?? res?.pickupLabel ?? null,
    dropLabel: res?.stop?.address ?? res?.drop_label ?? res?.dropLabel ?? null,
    vehicleName,
    vehicleImageUrl:
      res?.vehicle?.image_url ?? res?.vehicle_image_url ?? res?.vehicleImageUrl ?? null,
    etaMinutes,
    driverAssignAt: res?.driver_assign_at ?? res?.driverAssignAt ?? null,
    deliveredAt: res?.delivered_at ?? res?.deliveredAt ?? null,
    driverLocation: rawDriverLocation
      ? {
          ...rawDriverLocation,
          heading:
            res?.driver_location?.heading != null &&
            Number.isFinite(Number(res.driver_location.heading))
              ? Number(res.driver_location.heading)
              : null,
          stale: Boolean(res?.driver_location?.stale),
        }
      : null,
    driver,
    deliveryOtp: String(res?.stop?.delivery_otp ?? res?.delivery_otp ?? res?.deliveryOtp ?? ''),
    route,
  };
}
