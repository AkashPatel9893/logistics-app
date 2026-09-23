import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/lib/api/models';

import { MethodIcon } from './method-icon';

export interface PaymentMethodRowProps {
  method: PaymentMethod;
  isSelected: boolean;
  onPress: () => void;
}

export function PaymentMethodRow({ method, isSelected, onPress }: PaymentMethodRowProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={method.label}
      accessibilityState={{ checked: isSelected }}
      className={cn(
        'mb-3 flex-row items-center rounded-2xl border p-4',
        isSelected ? 'border-brand bg-brand-tint' : 'border-divider bg-surface',
      )}
    >
      <MethodIcon type={method.type} />
      <AppView className="ml-3 flex-1">
        <AppText className="text-[15px] font-bold text-foreground">{method.label}</AppText>
        <AppText className="mt-0.5 text-[12px] text-muted">{method.subtitle}</AppText>
      </AppView>
      {isSelected ? <Icon name="checkmark.circle.fill" size={22} tone="brand" /> : null}
    </AppPressable>
  );
}
