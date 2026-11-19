import { useState } from 'react';

import { alertNotServiceable, isServiceable } from '@/features/trip/serviceability';
import type { Order } from '@/lib/api/models';
import { haptics } from '@/lib/haptics';
import { useRouter } from '@/lib/navigation';
import { useVehicleCatalog } from '@/queries';
import { useTripStore } from '@/stores';

import { isFinishedOrder } from '../order-stage-labels';

export function canRebook(order: Order): boolean {
  return (
    isFinishedOrder(order.status) &&
    order.stops.length <= 1 &&
    order.pickup.location !== null &&
    order.drop.location !== null
  );
}

export function useRebook() {
  const router = useRouter();
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const catalog = useVehicleCatalog().data;

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
