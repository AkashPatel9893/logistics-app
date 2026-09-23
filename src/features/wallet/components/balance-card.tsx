import { useState } from 'react';

import { FadeIn } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppText, AppView, Button } from '@/components/ui';
import { DURATION } from '@/lib/motion';

const TOP_UP_AMOUNTS = [100, 200, 500, 1000] as const;

export interface BalanceCardProps {
  balance: number;
  isToppingUp: boolean;
  onTopUp: (amount: number) => void;
}

export function BalanceCard({ balance, isToppingUp, onTopUp }: BalanceCardProps) {
  const [isChoosingAmount, setIsChoosingAmount] = useState(false);

  const handleTopUp = (amount: number) => {
    onTopUp(amount);
    setIsChoosingAmount(false);
  };

  return (
    <AppView className="mb-6 rounded-2xl bg-surface p-5">
      <AppText className="text-[13px] font-medium text-muted">Wallet Balance</AppText>
      <AppText className="mt-1 text-[34px] font-extrabold text-foreground">
        ₹{balance.toFixed(2)}
      </AppText>
      <AppText className="mb-4 mt-2 text-[12px] text-subtle">
        Top up your wallet for instant 1-click booking checkout
      </AppText>

      {isChoosingAmount ? (
        <AnimatedView
          entering={FadeIn.duration(DURATION.small)}
          className="flex-row flex-wrap gap-2"
        >
          {TOP_UP_AMOUNTS.map((amount) => (
            <AppPressable
              key={amount}
              onPress={() => handleTopUp(amount)}
              accessibilityLabel={`Top up ₹${amount}`}
              className="rounded-full bg-brand-soft px-4 py-2.5"
            >
              <AppText className="text-[13px] font-bold text-brand">₹{amount}</AppText>
            </AppPressable>
          ))}
        </AnimatedView>
      ) : (
        <Button
          label="Top Up Wallet"
          variant="brand"
          loading={isToppingUp}
          onPress={() => setIsChoosingAmount(true)}
          className="h-auto py-3"
          textClassName="text-[14px]"
        />
      )}
    </AppView>
  );
}
