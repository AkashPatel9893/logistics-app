import { AppPressable, AppText, AppView, Card } from '@/components/ui';
import { VehicleImage } from '@/features/trip/components/vehicle-image';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { ORDER_STAGE_LABEL } from '../order-stage-labels';

export interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  // The order list carries no stops yet, so fall back to the order number — never a made-up place.
  const title = order.drop.label || `Order #${order.number}`;
  // Active and cancelled orders are highlighted; delivered ones are not.
  const isHighlighted = order.status !== 'delivered';

  return (
    <AppPressable
      onPress={() => onPress(order)}
      accessibilityLabel={`${title}, ${ORDER_STAGE_LABEL[order.status]}`}
      className="mb-3"
    >
      <Card className="overflow-hidden p-0">
        <AppView row className="p-4">
          <AppView center className="mr-3 size-12 overflow-hidden rounded-xl bg-surface-muted">
            <VehicleImage imageUrl={order.vehicle.imageUrl} style={{ width: 36, height: 36 }} />
          </AppView>
          <AppView className="flex-1">
            <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
              {title}
            </AppText>
            <AppText className="mt-0.5 text-[13px] text-subtle">
              {order.createdAt ? formatDateTime(Date.parse(order.createdAt)) : '—'}
            </AppText>
            <AppView row className="mt-1.5 gap-1">
              <AppText className="text-[13px] font-semibold text-foreground">
                {order.pricing.payable != null ? `₹${order.pricing.payable.toFixed(2)}` : '—'}
              </AppText>
              <AppText className="text-[13px] text-subtle"> · </AppText>
              <AppText
                className={cn(
                  'text-[13px] font-semibold',
                  isHighlighted ? 'text-brand' : 'text-foreground',
                )}
              >
                {ORDER_STAGE_LABEL[order.status]}
              </AppText>
            </AppView>
          </AppView>
        </AppView>
      </Card>
    </AppPressable>
  );
}
