import type { IconName } from '@/components/ui';
import type { PaymentMethodType } from '@/lib/api/models';

export const PAYMENT_METHOD_ICON: Record<PaymentMethodType, IconName> = {
  cash: 'banknote',
  upi: 'iphone',
  card: 'creditcard',
  paytm: 'wallet.pass.fill',
};
