import { ORDER_STAGE_LABEL } from '@/features/orders/order-stage-labels';
import { isActiveOrder, useOrders } from '@/queries';

export interface ActiveOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  destination: string;
  estimatedTime: string;
}

export function useActiveOrders(): ActiveOrderSummary[] {
  const { data: orders } = useOrders();

  return (orders ?? []).filter(isActiveOrder).map((order) => ({
    id: order.id,
    orderNumber: `Order #${order.number}`,
    status: order.noDriverFound ? 'No driver available yet' : ORDER_STAGE_LABEL[order.status],
    destination: order.drop.label,
    estimatedTime: order.etaMinutes !== null ? `${order.etaMinutes} min` : '',
  }));
}
