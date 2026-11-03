import { AppText, AppView } from '@/components/ui';
import type { Order } from '@/lib/api/models';

/** Where the package is going and what it costs, under the live status in the tracking sheet. */
export function OrderSummaryCard({ order }: { order: Order }) {
  const { discount, payable } = order.pricing;
  const payment = [
    // The method is only known once it is paid, so an unknown one is left out, not shown as "—".
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
    <AppView className="mt-4 rounded-2xl border border-divider p-4">
      <AppView row className="gap-3">
        <AppView className="size-2.5 rounded-full bg-pickup" />
        <AppText numberOfLines={1} className="flex-1 text-[14px] font-semibold text-foreground">
          {order.pickup.label}
        </AppText>
      </AppView>
      <AppView className="my-1 ml-[4px] h-3 w-0.5 bg-divider" />
      <AppView row className="gap-3">
        <AppView className="size-2.5 rounded-full bg-brand" />
        <AppText numberOfLines={1} className="flex-1 text-[14px] font-semibold text-foreground">
          {order.drop.label}
        </AppText>
      </AppView>

      <AppView row className="mt-3 justify-between border-t border-divider pt-3">
        <AppView className="flex-1">
          <AppText className="text-[13px] text-muted">
            {[`#${order.number}`, order.vehicle.name].filter(Boolean).join(' · ')}
          </AppText>
          {payment ? <AppText className="mt-0.5 text-[12px] text-muted">{payment}</AppText> : null}
        </AppView>
        <AppView className="items-end">
          <AppText className="text-[15px] font-bold text-foreground">
            {payable != null ? `₹${payable.toFixed(2)}` : 'Fare unavailable'}
          </AppText>
          {(discount ?? 0) > 0 ? (
            <AppText className="mt-0.5 text-[12px] font-semibold text-success">
              Saved ₹{(discount ?? 0).toFixed(2)}
            </AppText>
          ) : null}
        </AppView>
      </AppView>
    </AppView>
  );
}
