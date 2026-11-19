import type { Order } from '@/lib/api/models';
import { useVehicleCatalog } from '@/queries';

export function useOrderVehicle(order: Order) {
  const catalog = useVehicleCatalog().data;
  const fromCatalog = catalog
    ? [...catalog.featured, ...catalog.standard].find((v) => v.id === order.vehicle.id)
    : undefined;
  return {
    name: order.vehicle.name || fromCatalog?.name || 'Delivery',
    imageUrl: order.vehicle.imageUrl ?? fromCatalog?.imageUrl ?? null,
    code: order.vehicle.code ?? fromCatalog?.code ?? null,
    capacityKg: fromCatalog?.capacityKg ?? null,
  };
}
