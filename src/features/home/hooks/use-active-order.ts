import { ORDER_STAGE_LABEL } from '@/features/orders/order-stage-labels';
import { isActiveOrder, useOrders } from '@/hooks/use-orders';

export interface ActiveOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  estimatedTime: string;
}

/** The most recent in-progress order, summarized for the home card. */
export function useActiveOrder(): ActiveOrderSummary | undefined {
  const { data: orders } = useOrders();
  const order = orders?.find(isActiveOrder);
  if (!order) return undefined;

  return {
    id: order.id,
    orderNumber: `Order #${order.number}`,
    status: ORDER_STAGE_LABEL[order.status],
    estimatedTime: `${order.etaMinutes} min`,
  };
}
