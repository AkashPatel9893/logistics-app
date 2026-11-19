import type { Order } from '@/lib/api/models';
import { isActiveOrder, useOrderHistory } from '@/queries';

export type OrderListRow =
  | { kind: 'section'; id: string; title: string; isPast?: boolean }
  | { kind: 'empty-upcoming'; id: string }
  | { kind: 'empty-past'; id: string }
  | { kind: 'skeleton'; id: string }
  | { kind: 'order'; id: string; order: Order; index: number; isPast: boolean };

const SKELETON_ROWS: OrderListRow[] = [
  { kind: 'skeleton', id: 'skeleton-0' },
  { kind: 'skeleton', id: 'skeleton-1' },
  { kind: 'skeleton', id: 'skeleton-2' },
];

function buildOrderRows(orders: Order[], hasLoadError: boolean): OrderListRow[] {
  const upcoming = orders.filter(isActiveOrder);
  const past = orders.filter((order) => !isActiveOrder(order));
  const rows: OrderListRow[] = [];

  if (upcoming.length > 0 || past.length === 0) {
    rows.push({ kind: 'section', id: 'section-upcoming', title: 'In progress' });
  }
  if (!hasLoadError) {
    if (upcoming.length === 0) {
      if (past.length === 0) rows.push({ kind: 'empty-upcoming', id: 'empty-upcoming' });
    } else {
      upcoming.forEach((order, index) => {
        rows.push({ kind: 'order', id: order.id, order, index, isPast: false });
      });
    }
  }

  rows.push({ kind: 'section', id: 'section-past', title: 'Past', isPast: true });
  if (!hasLoadError) {
    if (past.length === 0) {
      rows.push({ kind: 'empty-past', id: 'empty-past' });
    } else {
      past.forEach((order, index) => {
        rows.push({
          kind: 'order',
          id: order.id,
          order,
          index: index + upcoming.length,
          isPast: true,
        });
      });
    }
  }

  return rows;
}

export function useOrderHistoryRows() {
  const ordersQuery = useOrderHistory();
  const orders = ordersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasLoadError = ordersQuery.isError && !ordersQuery.data;
  const rows = ordersQuery.isPending ? SKELETON_ROWS : buildOrderRows(orders, hasLoadError);

  return { rows, ordersQuery };
}
