import { AppText, AppView } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatShortDate } from '@/lib/format';
import type { WalletTransaction } from '@/lib/api/models';

export function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const isCredit = transaction.kind === 'credit';

  return (
    <AppView row className="mb-3 justify-between rounded-2xl bg-surface p-4">
      <AppView className="mr-3 flex-1">
        <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
          {transaction.title}
        </AppText>
        <AppText className="mt-0.5 text-[12px] text-subtle">
          {formatShortDate(transaction.createdAt)} · {isCredit ? 'Credit' : 'Debit'}
        </AppText>
      </AppView>
      <AppText
        className={cn('text-[14px] font-bold', isCredit ? 'text-success' : 'text-foreground')}
      >
        {isCredit ? '+' : '-'}₹{transaction.amount.toFixed(2)}
      </AppText>
    </AppView>
  );
}
