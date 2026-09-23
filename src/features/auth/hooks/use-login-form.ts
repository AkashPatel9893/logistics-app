import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguages } from '@/hooks/use-content';
import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';
import type { LanguageOption } from '@/lib/api/models';
import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

import { emailLoginSchema } from '../schema';

const FALLBACK_LANGUAGE: LanguageOption = { code: 'en', label: 'English', nativeLabel: 'English' };

export function useLoginForm() {
  const router = useRouter();
  const { data: languages = [FALLBACK_LANGUAGE] } = useLanguages();

  const [email, setEmail] = useState(() => kvStorage.getString(STORAGE_KEYS.CACHED_EMAIL) ?? '');
  const [languageCode, setLanguageCode] = useState(
    () => kvStorage.getString(STORAGE_KEYS.LANGUAGE_CODE) ?? FALLBACK_LANGUAGE.code,
  );
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sendOtp = useMutation({ mutationFn: (value: string) => authApi.sendOtp(value) });
  const language = languages.find((l) => l.code === languageCode) ?? languages[0];
  const isEmailValid = emailLoginSchema.safeParse({ email }).success;

  const handleLanguageSelect = (next: LanguageOption) => {
    setLanguageCode(next.code);
    kvStorage.setString(STORAGE_KEYS.LANGUAGE_CODE, next.code);
  };

  const handleEmailChange = (text: string) => {
    setValidationError(null);
    setEmail(text);
  };

  const handleContinue = () => {
    if (sendOtp.isPending) return;
    const parsed = emailLoginSchema.safeParse({ email });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Please enter a valid email address');
      return;
    }
    const cleanEmail = parsed.data.email;
    kvStorage.setString(STORAGE_KEYS.CACHED_EMAIL, cleanEmail);
    sendOtp.mutate(cleanEmail, {
      onSuccess: (challenge) =>
        router.push({
          pathname: '/otp',
          params: {
            email: cleanEmail,
            otpLength: String(challenge.otpLength),
            resendIn: String(challenge.resendInSeconds),
          },
        }),
      onError: (error) => setValidationError(getErrorMessage(error)),
    });
  };

  return {
    email,
    language,
    languages,
    showLanguageSheet,
    isLoading: sendOtp.isPending,
    validationError,
    isEmailValid,
    setShowLanguageSheet,
    handleLanguageSelect,
    handleEmailChange,
    handleContinue,
  };
}
