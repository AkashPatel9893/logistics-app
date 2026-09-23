import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppScrollView, AppText, AppView, Icon } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { cn } from '@/lib/cn';
import { useWalletStore, type PaymentMethod, type PaymentMethodType } from '@/stores/wallet-store';

const TOP_UP_AMOUNTS = [100, 200, 500, 1000];

// ─── Icons ──────────────────────────────────────────────────────────────────

export const METHOD_ICON: Record<PaymentMethodType, { symbol: string; emoji: string }> = {
  cash: { symbol: 'banknote', emoji: '💵' },
  upi: { symbol: 'iphone', emoji: '📱' },
  card: { symbol: 'creditcard', emoji: '💳' },
  paytm: { symbol: 'wallet.pass.fill', emoji: '👛' },
};

function MethodIcon({ type }: { type: PaymentMethodType }) {
  const icon = METHOD_ICON[type];
  return (
    <AppView className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 items-center justify-center">
      <Icon name={icon.symbol as any} size={18} color="#FF5A1F" />
    </AppView>
  );
}

// ─── Rows ───────────────────────────────────────────────────────────────────

function PaymentMethodRow({
  method,
  isSelected,
  onPress,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <AppPressable
      onPress={onPress}
      className={cn(
        'flex-row items-center p-4 rounded-2xl mb-3 border',
        isSelected
          ? 'border-[#FF5A1F] bg-orange-50/40 dark:bg-orange-950/20'
          : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900',
      )}
    >
      <MethodIcon type={method.type} />
      <AppView className="flex-1 ml-3">
        <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          {method.label}
        </AppText>
        <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          {method.subtitle}
        </AppText>
      </AppView>
      {isSelected ? <Icon name="checkmark.circle.fill" size={22} color="#FF5A1F" /> : null}
    </AppPressable>
  );
}

interface AddMethodRowProps {
  type: PaymentMethodType;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

function AddMethodRow({ type, title, subtitle, isOpen, onPress, children }: AddMethodRowProps) {
  return (
    <AppView
      className={cn(
        'rounded-2xl mb-3 border bg-white dark:bg-neutral-900 overflow-hidden',
        isOpen ? 'border-[#FF5A1F]' : 'border-neutral-100 dark:border-neutral-800',
      )}
    >
      <AppPressable onPress={onPress} className="flex-row items-center p-4">
        <MethodIcon type={type} />
        <AppView className="flex-1 ml-3">
          <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
            {title}
          </AppText>
          <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </AppText>
        </AppView>
        <Icon name={isOpen ? 'chevron.up' : 'chevron.right'} size={14} color="#9CA3AF" />
      </AppPressable>
      {isOpen ? <AppView className="px-4 pb-4">{children}</AppView> : null}
    </AppView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const balance = useWalletStore.use.balance();
  const paymentMethods = useWalletStore.use.paymentMethods();
  const selectedPaymentMethodId = useWalletStore.use.selectedPaymentMethodId();
  const transactions = useWalletStore.use.transactions();

  const [activeForm, setActiveForm] = useState<'upi' | 'card' | null>(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const hasUpi = paymentMethods.some((m) => m.type === 'upi');
  const hasCard = paymentMethods.some((m) => m.type === 'card');
  const hasPaytm = paymentMethods.some((m) => m.type === 'paytm');

  const handleAddUpi = () => {
    const trimmed = upiId.trim();
    if (!trimmed) return;
    useWalletStore.getState().addUpi(trimmed);
    setUpiId('');
    setActiveForm(null);
  };

  const handleAddCard = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return;
    useWalletStore.getState().addCard(digits);
    setCardNumber('');
    setActiveForm(null);
  };

  const handleLinkPaytm = () => {
    useWalletStore.getState().linkPaytm();
  };

  const handleTopUp = (amount: number) => {
    useWalletStore.getState().topUp(amount);
    setIsTopUpOpen(false);
  };

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Header ── */}
      <AppView style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-4">
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppText className="ml-3 text-[19px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Wallet
        </AppText>
      </AppView>

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Balance card ── */}
        <AppView className="bg-white dark:bg-neutral-900 rounded-2xl p-5 mb-6">
          <AppText className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
            Wallet Balance
          </AppText>
          <AppText className="text-[34px] font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
            ₹{balance.toFixed(2)}
          </AppText>
          <AppText className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-2 mb-4">
            Top up your wallet for instant 1-click booking checkout
          </AppText>

          {isTopUpOpen ? (
            <AppView className="flex-row flex-wrap gap-2">
              {TOP_UP_AMOUNTS.map((amount) => (
                <AppPressable
                  key={amount}
                  onPress={() => handleTopUp(amount)}
                  className="px-4 py-2.5 rounded-full bg-orange-50 dark:bg-orange-950/30"
                >
                  <AppText className="text-[13px] font-bold text-[#FF5A1F]">₹{amount}</AppText>
                </AppPressable>
              ))}
            </AppView>
          ) : (
            <AppPressable
              onPress={() => setIsTopUpOpen(true)}
              className="py-3 rounded-full bg-[#FF5A1F] items-center justify-center"
            >
              <AppText className="text-[14px] font-bold text-white">Top Up Wallet</AppText>
            </AppPressable>
          )}
        </AppView>

        {/* ── Payment Methods ── */}
        <AppText className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
          Payment Methods
        </AppText>

        {paymentMethods.map((method) => (
          <PaymentMethodRow
            key={method.id}
            method={method}
            isSelected={selectedPaymentMethodId === method.id}
            onPress={() => useWalletStore.getState().selectPaymentMethod(method.id)}
          />
        ))}

        {!hasUpi ? (
          <AddMethodRow
            type="upi"
            title="Add UPI ID"
            subtitle="Google Pay, PhonePe, BHIM"
            isOpen={activeForm === 'upi'}
            onPress={() => setActiveForm(activeForm === 'upi' ? null : 'upi')}
          >
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@upi"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-[14px] font-medium text-neutral-900 dark:text-neutral-100 mb-3"
            />
            <AppPressable
              onPress={handleAddUpi}
              className="py-3 rounded-full bg-[#FF5A1F] items-center justify-center"
            >
              <AppText className="text-[14px] font-bold text-white">Add UPI ID</AppText>
            </AppPressable>
          </AddMethodRow>
        ) : null}

        {!hasCard ? (
          <AddMethodRow
            type="card"
            title="Add Debit/Credit Card"
            subtitle="Visa, Mastercard, RuPay"
            isOpen={activeForm === 'card'}
            onPress={() => setActiveForm(activeForm === 'card' ? null : 'card')}
          >
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="Card number"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={19}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-[14px] font-medium text-neutral-900 dark:text-neutral-100 mb-3"
            />
            <AppPressable
              onPress={handleAddCard}
              className="py-3 rounded-full bg-[#FF5A1F] items-center justify-center"
            >
              <AppText className="text-[14px] font-bold text-white">Add Card</AppText>
            </AppPressable>
          </AddMethodRow>
        ) : null}

        {!hasPaytm ? (
          <AddMethodRow
            type="paytm"
            title="Link Paytm Wallet"
            subtitle="Direct wallet linking"
            isOpen={false}
            onPress={handleLinkPaytm}
          />
        ) : null}

        {/* ── Recent Transactions ── */}
        <AppText className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 mt-3 mb-3">
          Recent Transactions
        </AppText>

        {transactions.map((txn) => (
          <AppView
            key={txn.id}
            className="flex-row items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-3"
          >
            <AppView className="flex-1 mr-3">
              <AppText
                className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100"
                numberOfLines={1}
              >
                {txn.title}
              </AppText>
              <AppText className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                {txn.dateLabel} · {txn.kind === 'credit' ? 'Credit' : 'Debit'}
              </AppText>
            </AppView>
            <AppText
              className={cn(
                'text-[14px] font-bold',
                txn.kind === 'credit' ? 'text-green-600' : 'text-neutral-900 dark:text-neutral-100',
              )}
            >
              {txn.kind === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
            </AppText>
          </AppView>
        ))}
      </AppScrollView>
    </AppView>
  );
}
