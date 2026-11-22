import { AppPressable, AppText, AppView } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatFare } from '@/lib/format';
import { Alert } from '@/lib/native';
import { useAddTip } from '@/queries';

/**
 * Add a tip while we look for a driver. The backend sends `tipOptions` only while that is allowed
 * (searching, not prepaid), so the card disappears on its own once a driver accepts. Taps add up.
 */
export function TipCard({ order }: { order: Order }) {
  const addTip = useAddTip();
  const options = order.tipOptions;
  if (!options || options.amounts.length === 0) return null;

  const pendingAmount = addTip.isPending ? addTip.variables?.amount : null;

  return (
    <AppView className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3.5">
      <AppView row className="items-center justify-between">
        <AppText className="text-[15px] font-bold text-foreground">Add a tip</AppText>
        {order.tipTotal > 0 ? (
          <AppText className="text-[13px] font-semibold text-success">
            {formatFare(order.tipTotal)} added
          </AppText>
        ) : null}
      </AppView>
      <AppText className="mt-0.5 text-[12px] text-muted">
        Goes fully to your driver and can help us find one sooner.
      </AppText>
      <AppView row className="mt-3 flex-wrap gap-2">
        {options.amounts.map((amount) => {
          const tooMuch = amount > options.remaining;
          return (
            <AppPressable
              key={amount}
              disabled={addTip.isPending || tooMuch}
              onPress={() =>
                addTip.mutate(
                  { id: order.id, amount },
                  {
                    onError: (error) => Alert.alert('Could not add tip', getErrorMessage(error)),
                  },
                )
              }
              pressScale={0.96}
              accessibilityRole="button"
              accessibilityLabel={`Add ${formatFare(amount)} tip`}
              accessibilityState={{ disabled: addTip.isPending || tooMuch }}
              className={cn(
                'min-h-11 min-w-[72px] items-center justify-center rounded-xl border-[1.5px] px-4',
                pendingAmount === amount ? 'border-brand bg-brand/10' : 'border-border',
                tooMuch && 'opacity-40',
              )}
            >
              <AppText className="text-[15px] font-bold text-foreground">
                +{formatFare(amount)}
              </AppText>
            </AppPressable>
          );
        })}
      </AppView>
      {options.remaining < options.maxTotal ? (
        <AppText className="mt-2 text-[11.5px] text-muted">
          You can add up to {formatFare(options.remaining)} more.
        </AppText>
      ) : null}
    </AppView>
  );
}
