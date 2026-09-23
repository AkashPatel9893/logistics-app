import { IconBadge } from '@/components/ui';
import type { PaymentMethodType } from '@/lib/api/models';

import { PAYMENT_METHOD_ICON } from '../payment-method-icon';

export function MethodIcon({ type }: { type: PaymentMethodType }) {
  return (
    <IconBadge name={PAYMENT_METHOD_ICON[type]} tone="brand" className="rounded-xl bg-brand-soft" />
  );
}
