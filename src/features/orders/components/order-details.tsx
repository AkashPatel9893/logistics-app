import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Card,
  FocusAwareStatusBar,
  Icon,
  LiquidGlassBackButton,
} from '@/components/ui';
import { VehicleImage } from '@/features/trip/components/vehicle-image';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { ORDER_STAGE_LABEL } from '../order-stage-labels';
import { DeliveryRating } from './delivery-rating';

const rupees = (value: number) => `₹${value.toFixed(2)}`;

function PickupDot() {
  return (
    <AppView className="size-7 items-center justify-center rounded-full bg-emerald-500">
      <Icon name="arrow.up" size={14} color="#FFFFFF" />
    </AppView>
  );
}

function DropDot() {
  return (
    <AppView className="size-7 items-center justify-center rounded-full bg-rose-500">
      <Icon name="arrow.down" size={14} color="#FFFFFF" />
    </AppView>
  );
}

function RouteRow({
  dot,
  title,
  caption,
  isLast,
}: {
  dot: React.ReactNode;
  title: string;
  caption?: string;
  isLast: boolean;
}) {
  return (
    <AppView row>
      <AppView className="mr-3 items-center">
        {dot}
        {isLast ? null : (
          <AppView className="my-1 w-px flex-1 border-l border-dashed border-divider" />
        )}
      </AppView>
      <AppView className={cn('flex-1', isLast ? '' : 'pb-4')}>
        <AppText className="text-[15px] font-bold text-foreground">{title}</AppText>
        {caption ? <AppText className="mt-0.5 text-[12px] text-muted">{caption}</AppText> : null}
      </AppView>
    </AppView>
  );
}

function InvoiceLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <AppView row className="mt-2 justify-between">
      <AppText className={cn('text-[14px]', strong ? 'font-bold text-foreground' : 'text-muted')}>
        {label}
      </AppText>
      <AppText className={cn('text-[14px]', strong ? 'font-bold text-foreground' : 'text-muted')}>
        {value}
      </AppText>
    </AppView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <AppText className="mb-2 mt-6 text-[16px] font-bold text-foreground">{children}</AppText>;
}

export interface OrderDetailsProps {
  order: Order;
  rating: number | null;
  isRating: boolean;
  onRate: (rating: number) => void;
  onBack: () => void;
  onHelp: () => void;
}

/** Receipt for a delivered or cancelled order: route, status, rating and invoice — no map. */
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
  const { pricing } = order;
  const discount = pricing.discount ?? 0;
  const timingLabel =
    order.payment.timing === 'on-pickup'
      ? 'Pay at pickup'
      : order.payment.timing === 'on-delivery'
        ? 'Pay at drop'
        : null;
  const paymentLabel = [
    order.payment.methodLabel !== '—' ? order.payment.methodLabel : null,
    timingLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  // Intermediate stops come from the progress list; its last entry is the final drop.
  const middleStops = order.stops.length > 1 ? order.stops.slice(0, -1) : [];
  const tripFacts = [
    order.etaMinutes != null ? `${Math.round(order.etaMinutes)} mins` : null,
    pricing.distanceKm != null ? `${pricing.distanceKm.toFixed(1)} Km` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <AppView
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-3 px-5 pb-3"
      >
        <LiquidGlassBackButton onPress={onBack} size={40} controlSize="regular" />
        <AppText
          accessibilityRole="header"
          className="flex-1 text-[20px] font-extrabold text-foreground"
        >
          Order Details
        </AppText>
      </AppView>

      <AppScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="p-4">
          <AppView row className="items-start">
            <AppView className="flex-1">
              <AppText className="text-[20px] font-extrabold text-foreground">
                {order.vehicle.name || 'Delivery'}
              </AppText>
              {order.createdAt ? (
                <AppText className="mt-1 text-[13px] text-subtle">
                  {formatDateTime(Date.parse(order.createdAt))}
                </AppText>
              ) : null}
            </AppView>
            <AppView center className="size-14 overflow-hidden rounded-xl bg-surface-muted">
              <VehicleImage imageUrl={order.vehicle.imageUrl} style={{ width: 44, height: 44 }} />
            </AppView>
          </AppView>

          <AppView row className="mt-3 items-center justify-between">
            <AppText className="text-[18px] font-bold text-foreground">
              {pricing.payable != null ? rupees(pricing.payable) : 'Fare unavailable'}
            </AppText>
            <AppView
              className={cn(
                'rounded-full px-3 py-1.5',
                isDelivered ? 'bg-emerald-500/15' : 'bg-rose-500/15',
              )}
            >
              <AppText
                className={cn(
                  'text-[13px] font-semibold',
                  isDelivered ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {ORDER_STAGE_LABEL[order.status]}
              </AppText>
            </AppView>
          </AppView>

          <AppText className="mt-4 text-[13px] text-muted">Order ID #{order.number}</AppText>

          <AppView className="mt-4">
            <RouteRow dot={<PickupDot />} title={order.pickup.label || 'Pickup'} isLast={false} />
            {middleStops.map((stop) => (
              <RouteRow
                key={stop.number}
                dot={
                  <AppView className="size-7 items-center justify-center rounded-full bg-surface-muted">
                    <AppText className="text-[12px] font-bold text-foreground">
                      {stop.number}
                    </AppText>
                  </AppView>
                }
                title={stop.label}
                caption={stop.contactName ? `Receiver: ${stop.contactName}` : undefined}
                isLast={false}
              />
            ))}
            <RouteRow
              dot={<DropDot />}
              title={order.drop.label || 'Drop'}
              caption={tripFacts || undefined}
              isLast
            />
          </AppView>

          <AppPressable
            onPress={onHelp}
            accessibilityLabel="Help with this order"
            className="-mx-4 -mb-4 mt-4 flex-row items-center bg-surface-muted px-4 py-3"
          >
            <AppView center className="mr-3 size-10 rounded-full bg-brand">
              <Icon name="questionmark.circle" size={20} tone="brand-foreground" />
            </AppView>
            <AppView className="flex-1">
              <AppText className="text-[15px] font-bold text-foreground">Need help?</AppText>
              <AppText className="text-[12px] text-muted">We&apos;re a tap away</AppText>
            </AppView>
            <Icon name="chevron.right" size={16} tone="muted" />
          </AppPressable>
        </Card>

        {isDelivered ? (
          <>
            <SectionTitle>Rating</SectionTitle>
            <Card className="px-4 pb-4">
              <DeliveryRating
                driverName={order.driver?.name || 'your driver'}
                rating={rating}
                isSubmitting={isRating}
                onRate={onRate}
              />
            </Card>
          </>
        ) : null}

        {isDelivered && order.driver ? (
          <>
            <SectionTitle>Driver</SectionTitle>
            <Card className="p-4">
              <AppText className="text-[15px] font-bold text-foreground">
                {order.driver.name || 'Driver'}
              </AppText>
              <AppText className="mt-0.5 text-[13px] text-muted">
                {[order.driver.vehicleLabel, order.driver.vehiclePlate].filter(Boolean).join(' · ')}
              </AppText>
            </Card>
          </>
        ) : null}

        <SectionTitle>Invoice</SectionTitle>
        <Card className="p-4">
          <AppView row className="justify-between">
            <AppText className="text-[16px] font-bold text-foreground">
              {isDelivered ? 'Total Fare' : 'Amount'}
            </AppText>
            <AppText className="text-[16px] font-bold text-foreground">
              {pricing.payable != null ? rupees(pricing.payable) : '—'}
            </AppText>
          </AppView>
          <AppView className="mt-3 border-t border-divider pt-1">
            {pricing.fare != null ? (
              <InvoiceLine label="Delivery charge" value={rupees(pricing.fare)} />
            ) : null}
            {discount > 0 ? (
              <InvoiceLine
                label={pricing.couponCode ? `Coupon ${pricing.couponCode}` : 'Discount'}
                value={`− ${rupees(discount)}`}
              />
            ) : null}
            {pricing.payable != null ? (
              <InvoiceLine label="Total amount" value={rupees(pricing.payable)} strong />
            ) : null}
            {paymentLabel ? <InvoiceLine label="Payment" value={paymentLabel} /> : null}
          </AppView>
        </Card>
      </AppScrollView>
    </AppView>
  );
}
