import type { CountryCode, LanguageOption } from './types';

export const MOCK_COUNTRIES: CountryCode[] = [
  { id: 'in', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { id: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { id: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { id: 'ae', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { id: 'ca', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { id: 'sg', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { id: 'au', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { id: 'de', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
];

export const MOCK_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

export const MOCK_AUTH_CONFIG = {
  defaultCountryCode: '+91',
  defaultPhone: '9876543210',
  mockOtp: '5814',
  otpLength: 4,
  resendCountdownSeconds: 24,
} as const;
