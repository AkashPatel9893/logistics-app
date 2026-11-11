import type { ReactNode } from 'react';

import { AppPressable, AppText, AppView, Card, Icon, Skeleton } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { Order, OrderStatus } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatFare, formatOrderTime } from '@/lib/format';

import { ORDER_STAGE_LABEL } from '../order-stage-labels';
import { OrderRoute } from './order-route';
import { useOrderVehicle } from './trip-sheets';

/** Badge colours: green when delivered, red when it ended badly, brand while it's live. */
export function statusTone(status: OrderStatus): 'success' | 'danger' | 'brand' {
  if (status === 'delivered') return 'success';
  if (status === 'cancelled' || status === 'payment_failed' || status === 'delivery_failed')
    return 'danger';
  return 'brand';
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = statusTone(status);
  return (
    <AppView
      row
      className={cn(
        'items-center gap-1 self-start rounded-full px-2.5 py-1',
        tone === 'success' ? 'bg-success/10' : tone === 'danger' ? 'bg-danger/10' : 'bg-brand-soft',
      )}
    >
      <AppView
        className={cn(
          'size-1.5 rounded-full',
          tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-brand',
        )}
      />
      <AppText
        className={cn(
          'text-[11px] font-bold uppercase tracking-wide',
          tone === 'success'
            ? 'text-success'
            : tone === 'danger'
              ? 'text-danger'
              : 'text-brand-strong',
        )}
      >
        {ORDER_STAGE_LABEL[status]}
      </AppText>
    </AppView>
  );
}

export interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  /** A button beside the status, such as Report issue on the help screen. */
  action?: ReactNode;
}

/** One order in the history: vehicle, when and how much, its stops, then its status. */
export function OrderCard({ order, onPress, action }: OrderCardProps) {
  const vehicle = useOrderVehicle(order);
  const hasPlaces = Boolean(order.pickup.label || order.drop.label);
  // A cancelled order shows what it cost to cancel (usually nothing), not the fare it never paid.
  const amount =
    order.status === 'cancelled' ? (order.cancellationFee ?? 0) : order.pricing.payable;

  return (
    <Card variant="elevated" className="mb-3 overflow-hidden rounded-3xl p-0">
      <AppPressable
        onPress={() => onPress(order)}
        accessibilityRole="button"
        accessibilityLabel={`${vehicle.name}, ${ORDER_STAGE_LABEL[order.status]}. Open details`}
        className="p-4"
      >
        <AppView row className="items-center">
          <AppView center className="mr-3 size-12 overflow-hidden rounded-2xl bg-brand-soft">
            <VehicleImage
              imageUrl={vehicle.imageUrl}
              style={{ width: 40, height: 40 }}
              fallbackClassName="size-8 rounded-full bg-surface"
              fallbackIconSize={15}
              fallbackTone="brand"
            />
          </AppView>
          <AppView className="flex-1">
            <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
              {vehicle.name}
            </AppText>
            <AppText className="mt-0.5 text-[12.5px] text-muted">
              {order.createdAt ? formatOrderTime(Date.parse(order.createdAt)) : `#${order.number}`}
            </AppText>
          </AppView>
          <AppText className="mr-1 text-[16px] font-bold tabular-nums text-foreground">
            {amount != null ? formatFare(amount) : '—'}
          </AppText>
          <Icon name="chevron.right" size={15} tone="icon-subtle" />
        </AppView>

        {/* The history list can come without places: then the card skips the route. */}
        {hasPlaces ? (
          <AppView className="mt-3 rounded-2xl bg-surface-muted p-3 pb-2">
            <OrderRoute order={order} compact collapseStops />
          </AppView>
        ) : null}
      </AppPressable>

      <AppView row className="items-center justify-between border-t border-divider px-4 py-3">
        <StatusBadge status={order.status} />
        {action}
      </AppView>
    </Card>
  );
}

/** Placeholder shaped like an `OrderCard`, shown while history loads. */
export function OrderCardSkeleton() {
  return (
    <Card variant="elevated" className="mb-3 overflow-hidden rounded-3xl p-0">
      <AppView className="p-4">
        <AppView row className="items-center">
          <Skeleton className="mr-3 size-12 rounded-2xl" />
          <AppView className="flex-1 gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </AppView>
          <Skeleton className="h-4 w-14 rounded-md" />
        </AppView>
        <Skeleton className="mt-3 h-[72px] w-full rounded-2xl" />
      </AppView>
      <AppView row className="items-center justify-between border-t border-divider px-4 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </AppView>
    </Card>
  );
}
