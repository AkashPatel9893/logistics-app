import {
  AnimatedView,
  AppFlatList,
  AppText,
  AppView,
  Button,
  Card,
  FocusAwareStatusBar,
  IconBadge,
  ScreenHeader,
  SectionLabel,
  SkeletonCardList,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import { formatFare } from '@/lib/format';
import { enterFromBelow } from '@/lib/motion';
import { goBack, useRouter } from '@/lib/navigation';
import { useWallet } from '@/queries';

import { TransactionRow } from './components/transaction-row';

export function WalletScreen() {
  const router = useRouter();
  const walletQuery = useWallet();

  const wallet = walletQuery.data;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Payments" onBack={() => goBack(router)} />

      {walletQuery.isPending ? (
        <AppView className="p-4">
          <SkeletonCardList count={3} />
        </AppView>
      ) : walletQuery.isError || !wallet ? (
        <AppView className="flex-1 items-center justify-center px-8">
          <AppText className="mb-4 text-center text-[14px] text-muted">
            {getErrorMessage(walletQuery.error)}
          </AppText>
          <Button label="Try again" size="md" onPress={() => walletQuery.refetch()} />
        </AppView>
      ) : (
        <AppFlatList
          data={wallet.transactions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-safe-offset-6"
          ListHeaderComponent={
            <>
              <AnimatedView entering={enterFromBelow(0)}>
                <Card variant="elevated" className="mb-6 rounded-3xl p-0">
                  <AppView className="p-5">
                    <AppView row className="items-center gap-2">
                      <IconBadge
                        name="wallet.pass.fill"
                        tone="brand"
                        iconSize={16}
                        className="size-9 rounded-xl bg-brand-soft"
                      />
                      <AppText className="text-[14px] font-semibold text-muted">
                        Ryno credits
                      </AppText>
                    </AppView>
                    <AppText className="mt-3 text-[34px] font-black tabular-nums tracking-tight text-foreground">
                      {formatFare(wallet.balance)}
                    </AppText>
                  </AppView>
                </Card>
              </AnimatedView>
              <SectionLabel>Transactions</SectionLabel>
            </>
          }
          ListEmptyComponent={
            <AppText className="px-1 text-[13px] text-muted">No transactions yet.</AppText>
          }
          renderItem={({ item: transaction, index }) => (
            <AnimatedView entering={enterFromBelow(index + 1)}>
              <TransactionRow transaction={transaction} />
            </AnimatedView>
          )}
        />
      )}
    </AppView>
  );
}
