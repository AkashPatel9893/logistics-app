import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { goBack, useRouter } from '@/lib/navigation';
import { useValidateCoupon } from '@/queries';
import { useTripStore } from '@/stores';

export function useCouponInput() {
  const router = useRouter();
  const validate = useValidateCoupon();
  const appliedCode = useTripStore((state) => state.draft.couponCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onChangeCode = (text: string) => {
    setCode(text.replace(/\s/g, '').toUpperCase());
    setError(null);
  };

  const applyCode = (value: string) => {
    useTripStore.getState().setCouponCode(value);
    goBack(router);
  };

  const removeCode = () => {
    useTripStore.getState().setCouponCode(null);
  };

  const handleTypedApply = async () => {
    if (!code.trim() || validate.isPending) return;
    try {
      const coupon = await validate.mutateAsync(code);
      applyCode(coupon.code);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return {
    appliedCode,
    code,
    error,
    isValidating: validate.isPending,
    onChangeCode,
    applyCode,
    removeCode,
    handleTypedApply,
  };
}
