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
  const formatError =
    phone.length === 10 && !isPhoneValid
      ? 'Enter a valid 10-digit mobile number starting with 6–9'
      : null;

  const handlePhoneChange = (text: string) => {
    setValidationError(null);
    const digits = text.replace(/\D/g, '');
    const normalized =
      digits.length > 10 && digits.startsWith('91')
        ? digits.slice(2, 12)
        : digits.length > 10 && digits.startsWith('0')
          ? digits.slice(1, 11)
          : digits.slice(0, 10);
    setPhone(normalized);
  };

  const handleContinue = () => {
    if (sendOtp.isPending) return;
    const parsed = phoneLoginSchema.safeParse({ phone });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Enter a valid 10-digit mobile number');
      return;
    }
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
    validationError: validationError ?? formatError,
    isPhoneValid,
    handlePhoneChange,
    handleContinue,
  };
}
