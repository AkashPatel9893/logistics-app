import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { PAYMENT_METHOD_ICON } from '@/features/wallet/payment-method-icon';
import type { PaymentMethod } from '@/lib/api/models';

import { BookingSheet, SheetOption } from '@/components/booking-sheet';

export interface PaymentMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  selectedId: string | null;
  onSelect: (method: PaymentMethod) => void;
  onManage: () => void;
}

/** "Choose payment method": the wallet's methods; picking one makes it the default and closes. */
export function PaymentMethodSheet({
  visible,
  onClose,
  methods,
  selectedId,
  onSelect,
  onManage,
}: PaymentMethodSheetProps) {
  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      title="Choose payment method"
      subtitle="You pay after the delivery is done."
    >
      <AppView className="gap-2">
        {methods.map((method) => (
          <SheetOption
            key={method.id}
            label={method.label}
            subtitle={method.subtitle}
            icon={PAYMENT_METHOD_ICON[method.type]}
            selected={method.id === selectedId}
            onPress={() => {
              onSelect(method);
              onClose();
            }}
          />
        ))}
      </AppView>
      <AppPressable
        onPress={() => {
          onClose();
          onManage();
        }}
        accessibilityRole="button"
        className="mt-3 flex-row items-center justify-center gap-1.5 rounded-2xl bg-surface-muted py-3.5"
      >
        <Icon name="plus.circle.fill" size={16} tone="brand" />
        <AppText className="text-[14px] font-bold text-brand-strong">Add or manage methods</AppText>
      </AppPressable>
    </BookingSheet>
  );
}
