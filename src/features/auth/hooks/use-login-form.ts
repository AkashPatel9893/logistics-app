import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { useRouter } from '@/lib/navigation';
import { STORAGE_KEYS, useStorageString } from '@/lib/storage';
import { useSendOtp } from '@/queries';

import { phoneLoginSchema } from '../schema';

export function useLoginForm() {
  const router = useRouter();

  const [cachedPhone, setCachedPhone] = useStorageString(STORAGE_KEYS.CACHED_PHONE);
  const [phone, setPhone] = useState(() => cachedPhone ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const sendOtp = useSendOtp();
  const isPhoneValid = phoneLoginSchema.safeParse({ phone }).success;

  const handlePhoneChange = (text: string) => {
    setValidationError(null);
    setPhone(text.replace(/\D/g, '').slice(-10));
  };

  const handleContinue = () => {
    if (sendOtp.isPending) return;
    const parsed = phoneLoginSchema.safeParse({ phone });
    if (!parsed.success) return;
    const cleanPhone = parsed.data.phone;
    setCachedPhone(cleanPhone);
    sendOtp.mutate(cleanPhone, {
      onSuccess: (challenge) =>
        router.push({
          pathname: '/otp',
          params: {
            phone: cleanPhone,
            otpLength: String(challenge.otpLength),
            resendIn: String(challenge.resendInSeconds),
          },
        }),
      onError: (error) => setValidationError(getErrorMessage(error)),
    });
  };

  return {
    phone,
    isLoading: sendOtp.isPending,
    validationError,
    isPhoneValid,
    handlePhoneChange,
    handleContinue,
  };
}
