import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useVehicleCatalog } from '@/hooks/use-catalog';
import { alertNotServiceable, isServiceable } from '@/features/trip/serviceability';
import type { Order } from '@/lib/api/models';
import { haptics } from '@/lib/haptics';
import { useTripStore } from '@/stores/trip-store';

const REBOOKABLE_STATUSES = new Set<Order['status']>([
  'delivered',
  'cancelled',
  'delivery_failed',
  'payment_failed',
]);

/**
 * Only a finished order with one drop and known coordinates can be copied: the history does not
 * carry coordinates for extra stops, so a multi-stop trip would come back incomplete.
 */
export function canRebook(order: Order): boolean {
  return (
    REBOOKABLE_STATUSES.has(order.status) &&
    order.stops.length <= 1 &&
    order.pickup.location !== null &&
    order.drop.location !== null
  );
}

/** "Book again": copies a past order into a new booking and opens the vehicle step. */
export function useRebook() {
  const router = useRouter();
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const catalog = useVehicleCatalog().data;

  // The history list names the vehicle but may not carry its id, so fall back to the name. With
  // no match the vehicle step simply opens with its default choice.
  const vehicleIdFor = (order: Order): string | null =>
    order.vehicle.id ||
    [...(catalog?.featured ?? []), ...(catalog?.standard ?? [])].find(
      (vehicle) => vehicle.name === order.vehicle.name,
    )?.id ||
    null;

  const rebook = async (order: Order) => {
    if (rebookingId || !order.pickup.location || !order.drop.location) return;
    haptics.tap();
    setRebookingId(order.id);
    try {
      // The service area can change between bookings: check before the customer reaches a fare.
      if (!(await isServiceable(order.pickup.location))) return alertNotServiceable('pickup');
      if (!(await isServiceable(order.drop.location))) return alertNotServiceable('drop');
      useTripStore.getState().rebookFromOrder(order, vehicleIdFor(order));
      router.push('/trip-confirmation');
    } finally {
      setRebookingId(null);
    }
  };

  return { rebook, rebookingId };
}
