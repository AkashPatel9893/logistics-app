import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { useOrderInvoice } from '@/hooks/use-orders';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { enterFromBelow } from '@/lib/motion';
import { formatFare, formatOrderTime } from '@/lib/format';

import { DeliveryRating } from './delivery-rating';
import { StatusBadge } from './order-card';
import { OrderRoute } from './order-route';
import { useOrderVehicle } from './trip-sheets';

const rupees = (value: number) => `₹${value.toFixed(2)}`;

function FareLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <AppView
      row
      className={cn('justify-between', strong ? 'mt-3 border-t border-divider pt-3' : 'mt-2')}
    >
      <AppText className={cn('text-[14px]', strong ? 'font-bold text-foreground' : 'text-muted')}>
        {label}
      </AppText>
      <AppText
        className={cn(
          'text-[14px] tabular-nums',
          strong ? 'font-bold text-foreground' : 'text-foreground',
        )}
      >
        {value}
      </AppText>
    </AppView>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <AppText accessibilityRole="header" className="mb-1 text-[16px] font-bold text-foreground">
      {children}
    </AppText>
  );
}

export interface OrderDetailsProps {
  order: Order;
  rating: number | null;
  isRating: boolean;
  onRate: (rating: number) => void;
  onBack: () => void;
  onHelp: () => void;
}

/** "Trip details" for a delivered or cancelled order: what, where, what it cost. No map. */
export function OrderDetails({
  order,
  rating,
  isRating,
  onRate,
  onBack,
  onHelp,
}: OrderDetailsProps) {
  const insets = useSafeAreaInsets();
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const invoiceQuery = useOrderInvoice(order.id, isDelivered);
  const vehicle = useOrderVehicle(order);
  // A cancelled order costs its cancellation charge (usually nothing), not the fare.
  const amount = isCancelled ? (order.cancellationFee ?? 0) : order.pricing.payable;
  const paymentLabel = [
    order.payment.methodLabel !== '—' ? order.payment.methodLabel : null,
    order.payment.timing === 'on-pickup'
      ? 'Pay at pickup'
      : order.payment.timing === 'on-delivery'
        ? 'Pay at drop'
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Trip details" onBack={onBack} className="pb-3" />

      <AppScrollView
        contentContainerClassName="gap-3.5 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* When, which booking, how much and how it ended. */}
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

        {/* Vehicle and driver, then the route. */}
        <AnimatedView entering={enterFromBelow(0)}>
          <Card variant="elevated" className="rounded-3xl">
            <AppView row className="mb-4 items-center">
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

        {/* Fare: a cancelled order shows its cancellation charge; a delivered one, its bill. */}
        <AnimatedView entering={enterFromBelow(1)}>
          <Card variant="elevated" className="rounded-3xl">
            <CardTitle>Fare details</CardTitle>
            {isCancelled ? (
              <>
                <FareLine label="Cancellation charges" value={rupees(order.cancellationFee ?? 0)} />
                <FareLine label="Total" value={rupees(order.cancellationFee ?? 0)} strong />
              </>
            ) : isDelivered && invoiceQuery.data ? (
              <>
                <AppText className="text-[12px] text-muted">
                  Invoice {invoiceQuery.data.invoice_number}
                </AppText>
                {/* The GST invoice must itemise its lines, unlike the quote. */}
                {invoiceQuery.data.lines.map((line) => (
                  <FareLine
                    key={line.line_number}
                    label={line.description}
                    value={rupees(Number(line.total))}
                  />
                ))}
                <FareLine
                  label="Total"
                  value={rupees(Number(invoiceQuery.data.total_amount))}
                  strong
                />
              </>
            ) : (
              <>
                <FareLine
                  label="Fare"
                  value={order.pricing.payable != null ? rupees(order.pricing.payable) : '—'}
                />
                {isDelivered ? (
                  <AppText className="mt-2 text-[12px] text-muted">
                    {invoiceQuery.isPending
                      ? 'Loading invoice…'
                      : invoiceQuery.error &&
                          'status' in invoiceQuery.error &&
                          invoiceQuery.error.status === 404
                        ? 'Invoice not available yet.'
                        : 'Could not load the invoice.'}
                  </AppText>
                ) : null}
                {invoiceQuery.isError ? (
                  <AppPressable
                    onPress={() => void invoiceQuery.refetch()}
                    className="min-h-11 justify-center"
                  >
                    <AppText className="font-semibold text-brand">Retry invoice</AppText>
                  </AppPressable>
                ) : null}
              </>
            )}
            {paymentLabel && !isCancelled ? (
              <FareLine label="Payment" value={paymentLabel} />
            ) : null}
          </Card>
        </AnimatedView>

        {isDelivered ? (
          <Card variant="elevated" className="rounded-3xl px-4 pb-4">
            <CardTitle>Rate your trip</CardTitle>
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
