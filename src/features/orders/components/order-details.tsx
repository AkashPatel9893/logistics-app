import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  Card,
  FocusAwareStatusBar,
  Icon,
  LiquidGlassBackButton,
} from '@/components/ui';
import { VehicleImage } from '@/features/trip/components/vehicle-image';
import { useVehicleCatalog } from '@/hooks/use-catalog';
import { useOrderInvoice } from '@/hooks/use-orders';
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

/** Dotted line joining one route point to the next; stretches when a long address wraps. */
function RouteConnector() {
  return (
    <AppView className="min-h-7 flex-1 items-center justify-evenly py-1">
      {[0, 1, 2].map((dot) => (
        <AppView key={dot} className="size-1 rounded-full bg-border-strong" />
      ))}
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
    <AppView row className="items-stretch">
      <AppView className="mr-3 items-center">
        {dot}
        {isLast ? null : <RouteConnector />}
      </AppView>
      <AppView className={cn('flex-1 pt-1', isLast ? '' : 'pb-3')}>
        <AppText className="text-[15px] font-semibold text-foreground">{title}</AppText>
        {caption ? <AppText className="mt-0.5 text-[12px] text-muted">{caption}</AppText> : null}
      </AppView>
    </AppView>
  );
}

function TripFact({ label, value }: { label: string; value: string }) {
  return (
    <AppView className="flex-1 items-center">
      <AppText className="text-[15px] font-bold text-foreground">{value}</AppText>
      <AppText className="mt-0.5 text-[11px] font-medium text-muted">{label}</AppText>
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
  onBookAgain: () => void;
  onHelp: () => void;
}

/** Receipt for a delivered or cancelled order: route, status, rating and invoice — no map. */
export function OrderDetails({
  order,
  rating,
  isRating,
  onRate,
  onBack,
  onBookAgain,
  onHelp,
}: OrderDetailsProps) {
  const insets = useSafeAreaInsets();
  const invoiceQuery = useOrderInvoice(order.id, order.status === 'delivered');
  const isDelivered = order.status === 'delivered';
  const { pricing } = order;
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
  // Until a driver accepts, the order carries only the vehicle's id.
  const catalog = useVehicleCatalog().data;
  const catalogVehicle = catalog
    ? [...catalog.featured, ...catalog.standard].find((v) => v.id === order.vehicle.id)
    : undefined;
  const vehicleName = order.vehicle.name || catalogVehicle?.name || 'Delivery';
  const vehicleImage = order.vehicle.imageUrl ?? catalogVehicle?.imageUrl ?? null;

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
          <AppView row>
            <AppView center className="mr-3 size-12 overflow-hidden rounded-xl bg-surface-muted">
              <VehicleImage imageUrl={vehicleImage} style={{ width: 38, height: 38 }} />
            </AppView>
            <AppView className="flex-1">
              <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
                {vehicleName}
              </AppText>
              {order.createdAt ? (
                <AppText className="mt-0.5 text-[12px] text-muted">
                  {formatDateTime(Date.parse(order.createdAt))}
                </AppText>
              ) : null}
            </AppView>
            <AppView
              className={cn(
                'ml-2 rounded-full px-2.5 py-1',
                isDelivered ? 'bg-emerald-500/15' : 'bg-rose-500/15',
              )}
            >
              <AppText
                className={cn(
                  'text-[12px] font-semibold',
                  isDelivered ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {ORDER_STAGE_LABEL[order.status]}
              </AppText>
            </AppView>
          </AppView>

          <AppView className="mt-4 border-t border-divider pt-4">
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
            <RouteRow dot={<DropDot />} title={order.drop.label || 'Drop'} isLast />
          </AppView>

          <AppView row className="mt-4 rounded-2xl bg-surface-muted py-3">
            {pricing.payable != null ? (
              // Nothing was delivered on a cancelled order: this is the price offered, not a bill.
              <TripFact label={isDelivered ? 'Fare' : 'Quoted'} value={rupees(pricing.payable)} />
            ) : null}
            {order.etaMinutes != null ? (
              // The booking estimate: the order response has no actual trip time.
              <TripFact label="Est. time" value={`${Math.round(order.etaMinutes)} min`} />
            ) : null}
          </AppView>

          <AppText className="mt-3 text-center text-[12px] text-muted">
            Order ID #{order.number}
          </AppText>
        </Card>

        <AppPressable onPress={onHelp} accessibilityLabel="Help with this order" className="mt-3">
          <Card className="flex-row items-center p-3">
            <AppView center className="mr-3 size-9 rounded-full bg-brand-tint">
              <Icon name="message.fill" size={16} tone="brand" />
            </AppView>
            <AppView className="flex-1">
              <AppText className="text-[14px] font-semibold text-foreground">Need help?</AppText>
              <AppText className="text-[12px] text-muted">We&apos;re a tap away</AppText>
            </AppView>
            <Icon name="chevron.right" size={14} tone="icon-subtle" />
          </Card>
        </AppPressable>

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

        {isDelivered ? (
          <>
            <SectionTitle>Invoice</SectionTitle>
            <Card className="p-4">
              {invoiceQuery.data ? (
                <>
                  <AppText className="text-[12px] text-muted">
                    Invoice {invoiceQuery.data.invoice_number}
                  </AppText>
                  {invoiceQuery.data.lines.map((line) => (
                    <InvoiceLine
                      key={line.line_number}
                      label={line.description}
                      value={rupees(Number(line.total))}
                    />
                  ))}
                  <AppView className="mt-3 border-t border-divider pt-1">
                    <InvoiceLine
                      label="Total amount"
                      value={rupees(Number(invoiceQuery.data.total_amount))}
                      strong
                    />
                    {paymentLabel ? <InvoiceLine label="Payment" value={paymentLabel} /> : null}
                    {order.payment.status ? (
                      <InvoiceLine
                        label="Payment status"
                        value={
                          order.payment.status === 'PAID'
                            ? 'Paid'
                            : order.payment.status === 'PENDING'
                              ? 'Pending'
                              : order.payment.status
                        }
                      />
                    ) : null}
                  </AppView>
                </>
              ) : (
                <AppText className="text-[14px] text-muted">
                  {invoiceQuery.isPending
                    ? 'Loading invoice…'
                    : invoiceQuery.error &&
                        'status' in invoiceQuery.error &&
                        invoiceQuery.error.status === 404
                      ? 'Invoice not available yet.'
                      : 'Could not load invoice. Please try again.'}
                </AppText>
              )}
              {invoiceQuery.isError ? (
                <AppPressable
                  onPress={() => void invoiceQuery.refetch()}
                  className="min-h-11 justify-center"
                >
                  <AppText className="font-semibold text-brand">Retry invoice</AppText>
                </AppPressable>
              ) : null}
            </Card>
          </>
        ) : (
          <Button label="Book again" className="mt-6" onPress={onBookAgain} />
        )}
      </AppScrollView>
    </AppView>
  );
}
