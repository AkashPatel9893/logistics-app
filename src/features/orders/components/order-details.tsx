import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Card,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
} from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { Order } from '@/lib/api/models';
import { formatFare, formatOrderTime } from '@/lib/format';
import { enterFromBelow } from '@/lib/motion';

import { useOrderVehicle } from '../hooks/use-order-vehicle';
import { DeliveryRating } from './delivery-rating';
import { StatusBadge } from './order-card';
import { OrderFareCard } from './order-fare-card';
import { OrderRoute } from './order-route';

export interface OrderDetailsProps {
  order: Order;
  rating: number | null;
  isRating: boolean;
  onRate: (rating: number) => void;
  onBack: () => void;
  onHelp: () => void;
}

export function OrderDetails({
  order,
  rating,
  isRating,
  onRate,
  onBack,
  onHelp,
}: OrderDetailsProps) {
  const isDelivered = order.status === 'delivered';
  const vehicle = useOrderVehicle(order);
  const amount =
    order.status === 'cancelled' ? (order.cancellationFee ?? 0) : order.pricing.payable;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Trip details" onBack={onBack} className="pb-3" />

      <AppScrollView contentContainerClassName="gap-3.5 px-4 pb-safe-offset-6">
        <AppView row className="items-start px-1">
          <AppView className="flex-1">
            <AppText className="text-[16px] font-bold text-foreground">
              {order.createdAt ? formatOrderTime(Date.parse(order.createdAt)) : 'Booking'}
            </AppText>
            <AppText className="mt-0.5 text-[12.5px] text-muted">#{order.number}</AppText>
          </AppView>
          <AppView className="items-end gap-1.5">
            <AppText className="text-[18px] font-black tabular-nums text-foreground">
              {amount != null ? formatFare(amount) : '—'}
            </AppText>
            <StatusBadge status={order.status} />
          </AppView>
        </AppView>

        <AnimatedView entering={enterFromBelow(0)}>
          <Card variant="elevated" className="rounded-3xl">
            <AppView row className="mb-4 items-center">
              <AppView center className="mr-3 size-12 overflow-hidden rounded-2xl bg-brand-soft">
                <VehicleImage
                  imageUrl={vehicle.imageUrl}
                  code={vehicle.code}
                  style={{ width: 40, height: 40 }}
                />
              </AppView>
              <AppView className="flex-1">
                <AppText className="text-[16px] font-bold text-foreground">{vehicle.name}</AppText>
                <AppText numberOfLines={1} className="mt-0.5 text-[12.5px] text-muted">
                  {order.driver
                    ? [order.driver.name, order.driver.vehiclePlate].filter(Boolean).join(' · ')
                    : 'No driver assigned'}
                </AppText>
              </AppView>
            </AppView>
            <AppView className="rounded-2xl bg-surface-muted p-3.5 pb-2.5">
              <OrderRoute order={order} />
            </AppView>
          </Card>
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(1)}>
          <OrderFareCard order={order} />
        </AnimatedView>

        {isDelivered ? (
          <Card variant="elevated" className="rounded-3xl px-4 pb-4">
            <AppText
              accessibilityRole="header"
              className="mb-1 text-[16px] font-bold text-foreground"
            >
              Rate your trip
            </AppText>
            <DeliveryRating
              driverName={order.driver?.name || 'your driver'}
              rating={rating}
              isSubmitting={isRating}
              onRate={onRate}
            />
          </Card>
        ) : null}

        <AnimatedView entering={enterFromBelow(2)}>
          <AppPressable
            onPress={onHelp}
            accessibilityRole="button"
            accessibilityLabel="Need help with this trip?"
          >
            <Card variant="elevated" className="flex-row items-center rounded-3xl p-3.5">
              <IconBadge
                name="message.fill"
                tone="brand"
                className="mr-3 rounded-xl bg-brand-soft"
              />
              <AppView className="flex-1">
                <AppText className="text-[15px] font-bold text-foreground">Need help?</AppText>
                <AppText className="mt-0.5 text-[12px] text-muted">We&apos;re a tap away</AppText>
              </AppView>
              <Icon name="chevron.right" size={14} tone="icon-subtle" />
            </Card>
          </AppPressable>
        </AnimatedView>
      </AppScrollView>
    </AppView>
  );
}
