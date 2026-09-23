import { useState } from 'react';
import { TextInput } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { CouponCheck } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { DURATION } from '@/lib/motion';

export interface CouponFieldProps {
  /** The applied code, or null when none is applied. */
  appliedCode: string | null;
  /** Server's eligibility check of the applied code for the selected vehicle. */
  check: CouponCheck | null;
  /** Validates and applies a typed code; resolves to an error message, or null on success. */
  onApply: (code: string) => Promise<string | null>;
  onRemove: () => void;
}

const ROW_CLASS =
  'flex-row items-center rounded-2xl border border-dashed border-brand-border bg-brand-tint px-3 py-2.5';

/** Coupon entry at checkout: type the code shown on an offer banner, or remove it. */
export function CouponField({ appliedCode, check, onApply, onRemove }: CouponFieldProps) {
  const placeholderColor = useThemeColor('icon-subtle');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!code.trim() || isApplying) return;
    setIsApplying(true);
    const message = await onApply(code);
    setIsApplying(false);
    setError(message);
    if (!message) setCode('');
  };

  if (appliedCode) {
    return (
      <AnimatedView entering={FadeIn.duration(DURATION.small)} className={cn(ROW_CLASS, 'mb-3')}>
        <Icon name="tag.fill" size={15} tone="brand" />
        <AppView className="ml-2 flex-1">
          <AppText className="text-[14px] font-semibold text-foreground">{appliedCode}</AppText>
          {check ? (
            <AppText
              className={cn('mt-0.5 text-[12px]', check.valid ? 'text-success' : 'text-error')}
            >
              {check.valid ? `You save ₹${check.discount}` : check.reason}
            </AppText>
          ) : null}
        </AppView>
        <AppPressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel={`Remove coupon ${appliedCode}`}
        >
          <AppText className="text-[14px] font-bold text-muted">Remove</AppText>
        </AppPressable>
      </AnimatedView>
    );
  }

  return (
    <AppView className="mb-3">
      <AppView className={ROW_CLASS}>
        <Icon name="tag.fill" size={15} tone="brand" />
        <TextInput
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase());
            setError(null);
          }}
          placeholder="Have a coupon code?"
          placeholderTextColor={placeholderColor}
          accessibilityLabel="Coupon code"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleApply}
          className="ml-2 flex-1 p-0 text-[14px] font-semibold text-foreground"
        />
        {isApplying ? (
          <AppSpinner tone="brand" />
        ) : (
          <AppPressable
            onPress={handleApply}
            disabled={!code.trim()}
            hitSlop={8}
            accessibilityLabel="Apply coupon"
          >
            <AppText className="text-[14px] font-bold text-brand">Apply</AppText>
          </AppPressable>
        )}
      </AppView>
      {error ? (
        <AnimatedView entering={FadeIn.duration(DURATION.small)}>
          <AppText className="ml-1 mt-1 text-[12px] text-error">{error}</AppText>
        </AnimatedView>
      ) : null}
    </AppView>
  );
}
