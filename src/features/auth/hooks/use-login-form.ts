import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';
import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

import { phoneLoginSchema } from '../schema';

export function useLoginForm() {
  const router = useRouter();

  const [phone, setPhone] = useState(() => kvStorage.getString(STORAGE_KEYS.CACHED_PHONE) ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const sendOtp = useMutation({ mutationFn: (value: string) => authApi.sendOtp(value) });
  const isPhoneValid = phoneLoginSchema.safeParse({ phone }).success;

  const handlePhoneChange = (text: string) => {
    setValidationError(null);
    // Digits only; a pasted "+91 98765 43210" keeps its last 10.
    setPhone(text.replace(/\D/g, '').slice(-10));
  };

  const handleContinue = () => {
    if (sendOtp.isPending) return;
    // Continue is disabled until 10 digits are entered, so the keyboard's Done key just does nothing.
    const parsed = phoneLoginSchema.safeParse({ phone });
    if (!parsed.success) return;
    const cleanPhone = parsed.data.phone;
    kvStorage.setString(STORAGE_KEYS.CACHED_PHONE, cleanPhone);
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
