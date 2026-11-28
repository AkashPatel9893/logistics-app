import { AppPressable, AppText, AppView, Card } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Order } from '@/lib/api/models';
import { Alert } from '@/lib/native';
import { useOpenInvoicePdf, useOrderInvoice } from '@/queries';

const rupees = (value: number) => `₹${value.toFixed(2)}`;

function FareLine({ label, value }: { label: string; value: string }) {
  return (
    <AppView row className="mt-2 justify-between">
      <AppText className="text-[14px] text-muted">{label}</AppText>
      <AppText className="text-[14px] text-foreground">{value}</AppText>
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

/** One total for the trip (never the fare lines), how it is paid, and the invoice. */
export function OrderFareCard({ order }: { order: Order }) {
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const invoiceQuery = useOrderInvoice(order.id, isDelivered);
  const openPdf = useOpenInvoicePdf();
  const paymentLabel = getPaymentLabel(order);
  const invoiceTotal = invoiceQuery.data ? Number(invoiceQuery.data.total_amount) : null;
  // Tips are billed on top of the fare until the invoice adds them up.
  const total = isCancelled
    ? (order.cancellationFee ?? 0)
    : (invoiceTotal ??
      (order.pricing.payable != null ? order.pricing.payable + order.tipTotal : null));

  return (
    <Card variant="elevated" className="rounded-3xl">
      <AppView row className="items-center justify-between">
        <AppText accessibilityRole="header" className="text-[16px] font-bold text-foreground">
          {isCancelled ? 'Cancellation charge' : 'Total'}
        </AppText>
        <AppText className="text-[20px] font-black tabular-nums text-foreground">
          {total != null ? rupees(total) : 'N/A'}
        </AppText>
      </AppView>
      {paymentLabel && !isCancelled ? <FareLine label="Payment" value={paymentLabel} /> : null}
      {isDelivered && invoiceQuery.data ? (
        <AppPressable
          onPress={() =>
            openPdf.mutate(order.id, {
              onError: (error) => Alert.alert('Invoice', getErrorMessage(error)),
            })
          }
          disabled={openPdf.isPending}
          accessibilityRole="button"
          accessibilityLabel="Download invoice PDF"
          className="mt-2 min-h-11 justify-center"
        >
          <AppText className="font-semibold text-brand">
            {openPdf.isPending ? 'Opening invoice…' : 'Download invoice (PDF)'}
          </AppText>
        </AppPressable>
      ) : null}
      {isDelivered && invoiceQuery.isError ? (
        <AppPressable
          onPress={() => void invoiceQuery.refetch()}
          className="min-h-11 justify-center"
        >
          <AppText className="text-[13px] text-muted">
            {'status' in invoiceQuery.error && invoiceQuery.error.status === 404
              ? 'Invoice not available yet.'
              : 'Could not load the invoice. Tap to retry.'}
          </AppText>
        </AppPressable>
      ) : null}
    </Card>
  );
}
