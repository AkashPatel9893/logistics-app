import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { kvStorage, STORAGE_KEYS } from '@/lib/storage';
import { useThrottleCallback } from '@/lib/throttle';

import { sendOtp } from '../api';
import { MOCK_AUTH_CONFIG, MOCK_LANGUAGES } from '../mock-data';
import { emailLoginSchema } from '../schema';
import type { LanguageOption } from '../types';
import { DEFAULT_GUEST_NAME, signIn } from '../use-auth-store';

export function useLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState<string>(() => {
    return kvStorage.getString(STORAGE_KEYS.CACHED_EMAIL) ?? MOCK_AUTH_CONFIG.defaultEmail;
  });

  const [language, setLanguage] = useState<LanguageOption>(() => {
    const savedLangCode = kvStorage.getString(STORAGE_KEYS.LANGUAGE_CODE);
    return MOCK_LANGUAGES.find((l) => l.code === savedLangCode) ?? MOCK_LANGUAGES[0];
  });

  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (email) {
      kvStorage.setString(STORAGE_KEYS.CACHED_EMAIL, email);
    }
  }, [email]);

  const handleLanguageSelect = (newLang: LanguageOption) => {
    setLanguage(newLang);
    kvStorage.setString(STORAGE_KEYS.LANGUAGE_CODE, newLang.code);
  };

  const handleEmailChange = (text: string) => {
    setValidationError(null);
    setEmail(text);
  };

  const handleContinue = useThrottleCallback(async () => {
    const validationResult = emailLoginSchema.safeParse({ email });

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message ?? 'Please enter a valid email address';
      setValidationError(errorMsg);
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    const cleanEmail = validationResult.data.email;
    setIsLoading(true);

    try {
      const response = await sendOtp(cleanEmail);
      if (response.success) {
        router.push({
          pathname: '/otp',
          params: {
            email: cleanEmail,
          },
        });
      } else {
        Alert.alert('Error', response.message);
      }
    } catch {
      Alert.alert('Error', 'Unable to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, 1000);

  const handleContinueAsGuest = useThrottleCallback(() => {
    signIn(
      { accessToken: 'guest_access_token', refreshToken: 'guest_refresh_token' },
      {
        id: `guest_${Date.now().toString(36)}`,
        email: '',
        name: DEFAULT_GUEST_NAME,
        role: 'guest',
      },
    );
  }, 1000);

  const isEmailValid = emailLoginSchema.safeParse({ email }).success;

  return {
    email,
    language,
    showLanguageSheet,
    isLoading,
    validationError,
    isEmailValid,
    setShowLanguageSheet,
    handleLanguageSelect,
    handleEmailChange,
    handleContinue,
    handleContinueAsGuest,
  };
}
