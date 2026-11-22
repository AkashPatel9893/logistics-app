import { useState } from 'react';

import { mapPickerHref } from '@/features/trip/map-picker-route';
import { alertNotServiceable, isServiceable } from '@/features/trip/serviceability';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Order } from '@/lib/api/models';
import { ordersApi } from '@/lib/api/orders';
import { haptics } from '@/lib/haptics';
import { Alert } from '@/lib/native';
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
      const needsContacts =
        !order.drop.contact?.name ||
        !order.drop.contact?.phone ||
        !order.pickup.contact?.name ||
        !order.pickup.contact?.phone;
      const resolvedOrder = needsContacts ? await ordersApi.get(order.id) : order;
      if (!resolvedOrder.pickup.location || !resolvedOrder.drop.location) return;
      if (!(await isServiceable(resolvedOrder.pickup.location))) {
        return alertNotServiceable('pickup');
      }
      if (!(await isServiceable(resolvedOrder.drop.location))) {
        return alertNotServiceable('drop');
      }
      useTripStore.getState().rebookFromOrder(resolvedOrder, vehicleIdFor(resolvedOrder));
      if (resolvedOrder.drop.contact?.name && resolvedOrder.drop.contact?.phone) {
        router.push('/trip-confirmation');
      } else {
        router.push(
          mapPickerHref({ mode: 'confirm', kind: 'drop', region: resolvedOrder.drop.location }),
        );
      }
    } catch (error) {
      Alert.alert('Could not book again', getErrorMessage(error));
    } finally {
      setRebookingId(null);
    }
  };

  return { rebook, rebookingId };
}
