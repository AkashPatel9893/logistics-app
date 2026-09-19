import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { kvStorage, STORAGE_KEYS } from '@/lib/storage';
import { useThrottleCallback } from '@/lib/throttle';

import { sendOtp } from '../api';
import { MOCK_AUTH_CONFIG, MOCK_COUNTRIES, MOCK_LANGUAGES } from '../mock-data';
import { phoneLoginSchema } from '../schema';
import type { CountryCode, LanguageOption } from '../types';
import { DEFAULT_GUEST_NAME, signIn } from '../use-auth-store';

export function useLoginForm() {
  const router = useRouter();

  const formatPhone = (text: string) => {
    const raw = text.replace(/[^0-9]/g, '').slice(0, 10);
    if (raw.length > 5) {
      return `${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    return raw;
  };

  const [country, setCountry] = useState<CountryCode>(() => {
    const savedCountryId = kvStorage.getString(STORAGE_KEYS.COUNTRY_ID);
    return MOCK_COUNTRIES.find((c) => c.id === savedCountryId) ?? MOCK_COUNTRIES[0];
  });

  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    const cached = kvStorage.getString(STORAGE_KEYS.CACHED_PHONE) ?? MOCK_AUTH_CONFIG.defaultPhone;
    return formatPhone(cached);
  });

  const [language, setLanguage] = useState<LanguageOption>(() => {
    const savedLangCode = kvStorage.getString(STORAGE_KEYS.LANGUAGE_CODE);
    return MOCK_LANGUAGES.find((l) => l.code === savedLangCode) ?? MOCK_LANGUAGES[0];
  });

  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (phoneNumber) {
      kvStorage.setString(STORAGE_KEYS.CACHED_PHONE, phoneNumber);
    }
  }, [phoneNumber]);

  const handleCountrySelect = (newCountry: CountryCode) => {
    setCountry(newCountry);
    kvStorage.setString(STORAGE_KEYS.COUNTRY_ID, newCountry.id);
  };

  const handleLanguageSelect = (newLang: LanguageOption) => {
    setLanguage(newLang);
    kvStorage.setString(STORAGE_KEYS.LANGUAGE_CODE, newLang.code);
  };

  const handlePhoneChange = (text: string) => {
    setValidationError(null);
    setPhoneNumber(formatPhone(text));
  };

  const handleContinue = useThrottleCallback(async () => {
    const validationResult = phoneLoginSchema.safeParse({
      countryCode: country.dialCode,
      phoneNumber,
    });

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message ?? 'Please enter a valid mobile number';
      setValidationError(errorMsg);
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    const cleanPhone = validationResult.data.phoneNumber;
    setIsLoading(true);

    try {
      const response = await sendOtp(country.dialCode, cleanPhone);
      if (response.success) {
        router.push({
          pathname: '/otp',
          params: {
            countryCode: country.dialCode,
            phone: cleanPhone,
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
        phone: '',
        countryCode: '',
        name: DEFAULT_GUEST_NAME,
        role: 'guest',
      },
    );
  }, 1000);

  const cleanPhoneLength = phoneNumber.replace(/\s+/g, '').length;

  return {
    country,
    phoneNumber,
    language,
    showCountrySheet,
    showLanguageSheet,
    isLoading,
    validationError,
    cleanPhoneLength,
    setShowCountrySheet,
    setShowLanguageSheet,
    handleCountrySelect,
    handleLanguageSelect,
    handlePhoneChange,
    handleContinue,
    handleContinueAsGuest,
  };
}
