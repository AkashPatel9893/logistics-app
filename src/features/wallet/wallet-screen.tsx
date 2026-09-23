import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppKeyboardAvoidingView,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
  SectionLabel,
} from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import {
  useAddPaymentMethod,
  useSetDefaultPaymentMethod,
  useTopUpWallet,
  useWallet,
} from '@/hooks/use-wallet';
import { getErrorMessage } from '@/lib/api/api-error';
import type { AddPaymentMethodInput } from '@/lib/api/models';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';

import { AddMethodForm } from './components/add-method-form';
import { AddMethodRow } from './components/add-method-row';
import { BalanceCard } from './components/balance-card';
import { PaymentMethodRow } from './components/payment-method-row';
import { TransactionRow } from './components/transaction-row';

type MethodForm = 'upi' | 'card';

// Light client checks; the server validates for real.
const isValidUpiId = (value: string) => value.trim().length > 0;
const isValidCardNumber = (value: string) => value.replace(/\D/g, '').length >= 4;

export function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const walletQuery = useWallet();
  const topUp = useTopUpWallet();
  const addMethod = useAddPaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const [openForm, setOpenForm] = useState<MethodForm | null>(null);
  const listLayout = useLayoutTransition();

  const wallet = walletQuery.data;
  const hasMethod = (type: string) => wallet?.paymentMethods.some((m) => m.type === type) ?? false;
  const toggleForm = (form: MethodForm) => setOpenForm((open) => (open === form ? null : form));
  const showError = (error: unknown) => Alert.alert('Something went wrong', getErrorMessage(error));

  const handleAddMethod = (input: AddPaymentMethodInput) =>
    addMethod.mutate(input, { onSuccess: () => setOpenForm(null), onError: showError });

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Wallet" onBack={() => router.back()} />

      {walletQuery.isPending ? (
        <AppView className="flex-1 items-center justify-center">
          <AppSpinner size="large" tone="brand" />
        </AppView>
      ) : walletQuery.isError || !wallet ? (
        <AppView className="flex-1 items-center justify-center px-8">
          <AppText className="mb-4 text-center text-[14px] text-muted">
            {getErrorMessage(walletQuery.error)}
          </AppText>
          <Button label="Try again" size="md" onPress={() => walletQuery.refetch()} />
        </AppView>
      ) : (
        // Keeps the UPI/card field above the keyboard: iOS insets the scroll view
        // natively; edge-to-edge Android needs the avoiding view instead.
        <AppKeyboardAvoidingView enabled={Platform.OS === 'android'}>
          <AppScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          >
            <AnimatedView entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}>
              <BalanceCard
                balance={wallet.balance}
                isToppingUp={topUp.isPending}
                onTopUp={(amount) => topUp.mutate(amount, { onError: showError })}
              />
            </AnimatedView>

            <SectionLabel>Payment Methods</SectionLabel>
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

              {!hasMethod('upi') ? (
                <AddMethodRow
                  type="upi"
                  title="Add UPI ID"
                  subtitle="Google Pay, PhonePe, BHIM"
                  isOpen={openForm === 'upi'}
                  onPress={() => toggleForm('upi')}
                >
                  <AddMethodForm
                    placeholder="yourname@upi"
                    submitLabel="Add UPI ID"
                    autoCapitalize="none"
                    isSubmitting={addMethod.isPending}
                    isValid={isValidUpiId}
                    onSubmit={(upiId) => handleAddMethod({ type: 'upi', upiId })}
                  />
                </AddMethodRow>
              ) : null}

              {!hasMethod('card') ? (
                <AddMethodRow
                  type="card"
                  title="Add Debit/Credit Card"
                  subtitle="Visa, Mastercard, RuPay"
                  isOpen={openForm === 'card'}
                  onPress={() => toggleForm('card')}
                >
                  <AddMethodForm
                    placeholder="Card number"
                    submitLabel="Add Card"
                    keyboardType="number-pad"
                    maxLength={19}
                    isSubmitting={addMethod.isPending}
                    isValid={isValidCardNumber}
                    onSubmit={(cardNumber) => handleAddMethod({ type: 'card', cardNumber })}
                  />
                </AddMethodRow>
              ) : null}

              {!hasMethod('paytm') ? (
                <AddMethodRow
                  type="paytm"
                  title="Link Paytm Wallet"
                  subtitle="Direct wallet linking"
                  isOpen={false}
                  onPress={() => handleAddMethod({ type: 'paytm' })}
                />
              ) : null}
            </AnimatedView>

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
          </AppScrollView>
        </AppKeyboardAvoidingView>
      )}
    </AppView>
  );
}
