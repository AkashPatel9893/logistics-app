import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppScrollView,
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
import { useWallet } from '@/hooks/use-wallet';
import { getErrorMessage } from '@/lib/api/api-error';
import { formatFare } from '@/lib/format';
import { goBack } from '@/lib/go-back';
import { enterFromBelow } from '@/lib/motion';

import { TransactionRow } from './components/transaction-row';

/**
 * Ryno credits balance and its transactions (`GET /wallet`, `GET /wallet/transactions`). No Add
 * money: the backend's top-up is dev-only until a payment gateway lands.
 */
export function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <AppScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
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
                  <AppText className="text-[14px] font-semibold text-muted">Ryno credits</AppText>
                </AppView>
                <AppText className="mt-3 text-[34px] font-black tabular-nums tracking-tight text-foreground">
                  {formatFare(wallet.balance)}
                </AppText>
              </AppView>
            </Card>
          </AnimatedView>

          <SectionLabel>Transactions</SectionLabel>
          {wallet.transactions.length > 0 ? (
            wallet.transactions.map((transaction, index) => (
              <AnimatedView key={transaction.id} entering={enterFromBelow(index + 1)}>
                <TransactionRow transaction={transaction} />
              </AnimatedView>
            ))
          ) : (
            <AppText className="px-1 text-[13px] text-muted">No transactions yet.</AppText>
          )}
        </AppScrollView>
      )}
    </AppView>
  );
}
