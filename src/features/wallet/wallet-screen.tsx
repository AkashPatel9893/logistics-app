import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
  SectionLabel,
  SkeletonCardList,
} from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { useSetDefaultPaymentMethod, useWallet } from '@/hooks/use-wallet';
import { getErrorMessage } from '@/lib/api/api-error';
import { goBack } from '@/lib/go-back';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';

import { PaymentMethodRow } from './components/payment-method-row';
import { TransactionRow } from './components/transaction-row';

/**
 * Payment methods and history. Only cash on delivery is live, so nothing else is offered: no top-up
 * and no card / UPI / Paytm linking until the backend supports them.
 */
export function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const walletQuery = useWallet();
  const setDefault = useSetDefaultPaymentMethod();
  const listLayout = useLayoutTransition();

  const wallet = walletQuery.data;
  const showError = (error: unknown) => Alert.alert('Something went wrong', getErrorMessage(error));

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Payment" onBack={() => goBack(router)} />

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
          <AnimatedView entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}>
            <AppView className="mb-6 rounded-2xl bg-surface p-5">
              <AppText className="text-[16px] font-bold text-foreground">Pay on delivery</AppText>
              <AppText className="mt-1 text-[13px] leading-5 text-muted">
                Pay the driver in cash when your parcel is delivered. Online payments are not
                available yet.
              </AppText>
            </AppView>
          </AnimatedView>

          <SectionLabel>Payment Method</SectionLabel>
          <AnimatedView layout={listLayout}>
            {wallet.paymentMethods.map((method) => (
              <AnimatedView
                key={method.id}
                entering={FadeIn.duration(DURATION.small)}
                layout={listLayout}
              >
                <PaymentMethodRow
                  method={method}
                  isSelected={wallet.defaultPaymentMethodId === method.id}
                  onPress={() => setDefault.mutate(method.id, { onError: showError })}
                />
              </AnimatedView>
            ))}
          </AnimatedView>

          {wallet.transactions.length > 0 ? (
            <>
              <SectionLabel className="mt-3">Recent Transactions</SectionLabel>
              {wallet.transactions.map((transaction, index) => (
                <AnimatedView
                  key={transaction.id}
                  entering={FadeInDown.duration(DURATION.enter)
                    .delay(staggerDelay(index))
                    .easing(ENTER_EASE_OUT)}
                >
                  <TransactionRow transaction={transaction} />
                </AnimatedView>
              ))}
            </>
          ) : null}
        </AppScrollView>
      )}
    </AppView>
  );
}
