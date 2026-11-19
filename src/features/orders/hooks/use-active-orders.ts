import { ORDER_STAGE_LABEL } from '@/features/orders/order-stage-labels';
import { isActiveOrder, useOrders } from '@/queries';

export interface ActiveOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  /** Where it is going, from the order itself (no map lookup). */
  destination: string;
  /** The trip's estimated minutes ("12 min"); empty when the backend gave none. */
  estimatedTime: string;
}

/** Every in-progress order, newest first, summarized for the ride strip above the tab bar. */
export function useActiveOrders(): ActiveOrderSummary[] {
  const { data: orders } = useOrders();

  return (orders ?? []).filter(isActiveOrder).map((order) => ({
    id: order.id,
    orderNumber: `Order #${order.number}`,
    // Same wording as the tracking screen, so the card never says "Finding driver" while it says "No driver".
    status: order.noDriverFound ? 'No driver available yet' : ORDER_STAGE_LABEL[order.status],
    destination: order.drop.label,
    estimatedTime: order.etaMinutes !== null ? `${order.etaMinutes} min` : '',
  }));
}
