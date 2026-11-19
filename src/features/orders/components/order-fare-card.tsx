import { AppPressable, AppText, AppView, Card } from '@/components/ui';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { useOrderInvoice } from '@/queries';

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
      <AppText className={cn('text-[14px] tabular-nums text-foreground', strong && 'font-bold')}>
        {value}
      </AppText>
    </AppView>
  );
}

function getPaymentLabel(order: Order): string {
  return [
    order.payment.methodLabel !== '—' ? order.payment.methodLabel : null,
    order.payment.timing === 'on-pickup'
      ? 'Pay at pickup'
      : order.payment.timing === 'on-delivery'
        ? 'Pay at drop'
        : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function OrderFareCard({ order }: { order: Order }) {
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const invoiceQuery = useOrderInvoice(order.id, isDelivered);
  const paymentLabel = getPaymentLabel(order);

  return (
    <Card variant="elevated" className="rounded-3xl">
      <AppText accessibilityRole="header" className="mb-1 text-[16px] font-bold text-foreground">
        Fare details
      </AppText>
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
          {invoiceQuery.data.lines.map((line) => (
            <FareLine
              key={line.line_number}
              label={line.description}
              value={rupees(Number(line.total))}
            />
          ))}
          <FareLine label="Total" value={rupees(Number(invoiceQuery.data.total_amount))} strong />
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
      {paymentLabel && !isCancelled ? <FareLine label="Payment" value={paymentLabel} /> : null}
    </Card>
  );
}
