import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguages } from '@/hooks/use-content';
import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';
import type { LanguageOption } from '@/lib/api/models';
import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

import { phoneLoginSchema } from '../schema';

const FALLBACK_LANGUAGE: LanguageOption = { code: 'en', label: 'English', nativeLabel: 'English' };

export function useLoginForm() {
  const router = useRouter();
  const { data: languages = [FALLBACK_LANGUAGE] } = useLanguages();

  const [phone, setPhone] = useState(() => kvStorage.getString(STORAGE_KEYS.CACHED_PHONE) ?? '');
  const [languageCode, setLanguageCode] = useState(
    () => kvStorage.getString(STORAGE_KEYS.LANGUAGE_CODE) ?? FALLBACK_LANGUAGE.code,
  );
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sendOtp = useMutation({ mutationFn: (value: string) => authApi.sendOtp(value) });
  const language = languages.find((l) => l.code === languageCode) ?? languages[0];
  const isPhoneValid = phoneLoginSchema.safeParse({ phone }).success;

  const handleLanguageSelect = (next: LanguageOption) => {
    setLanguageCode(next.code);
    kvStorage.setString(STORAGE_KEYS.LANGUAGE_CODE, next.code);
  };

  const handlePhoneChange = (text: string) => {
    setValidationError(null);
    // Digits only; a pasted "+91 98765 43210" keeps its last 10.
    setPhone(text.replace(/\D/g, '').slice(-10));
  };

  const handleContinue = () => {
    if (sendOtp.isPending) return;
    const parsed = phoneLoginSchema.safeParse({ phone });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Enter a valid 10-digit mobile number');
      return;
    }
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
    language,
    languages,
    showLanguageSheet,
    isLoading: sendOtp.isPending,
    validationError,
    isPhoneValid,
    setShowLanguageSheet,
    handleLanguageSelect,
    handlePhoneChange,
    handleContinue,
  };
}
