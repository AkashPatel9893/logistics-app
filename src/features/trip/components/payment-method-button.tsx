import { AppPressable, AppText, Icon } from '@/components/ui';
import { PAYMENT_METHOD_ICON } from '@/features/wallet/payment-method-icon';
import type { PaymentMethod } from '@/lib/api/models';

export interface PaymentMethodButtonProps {
  method: PaymentMethod;
  onPress: () => void;
}

export function PaymentMethodButton({ method, onPress }: PaymentMethodButtonProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityLabel={`Payment method: ${method.label}. Change`}
      className="h-full flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-surface-muted"
    >
      <Icon name={PAYMENT_METHOD_ICON[method.type]} size={16} tone="brand" />
      <AppText numberOfLines={1} className="text-[16px] font-semibold text-foreground">
        {method.label}
      </AppText>
      <Icon name="chevron.right" size={14} tone="icon-subtle" />
    </AppPressable>
  );
}
