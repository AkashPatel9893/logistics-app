import { Image, TextInput } from 'react-native';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppSafeAreaView,
  AppScrollView,
  AppText,
  AppView,
  Button,
} from '@/components/ui';

import { CountryPickerSheet } from './components/country-picker-sheet';
import { HeroBanner } from './components/hero-banner';
import { LanguagePickerSheet } from './components/language-picker-sheet';
import { LanguagePill } from './components/language-pill';
import { useLoginForm } from './hooks/use-login-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INDIA_FLAG_IMAGE = require('@/assets/images/country-flags/Icon background.png');

export function LoginScreen() {
  const {
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
  } = useLoginForm();

  const insets = useSafeAreaInsets();

  return (
    <AppSafeAreaView edges={[]} className="flex-1 bg-white dark:bg-neutral-950">
      <AppKeyboardAvoidingView>
        <AppScrollView style={{ paddingTop: insets.top }} contentContainerClassName="grow pb-6">
          <HeroBanner />

          <AppView className="px-6 pt-20">
            <AppText className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Lets get started
            </AppText>
            <AppText className="text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-1">
              Login/ Signup with Mobile
            </AppText>

            {/* Side-by-side inputs: Country Code Pill + Phone Number Box */}
            <AppView className="flex-row items-center gap-3 mt-4">
              <AppPressable
                onPress={() => setShowCountrySheet(true)}
                className="h-14 px-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex-row items-center justify-center gap-2 active:opacity-80"
                style={{ height: 56 }}
                accessibilityLabel="Select country code"
              >
                {country.id === 'in' ? (
                  <Image
                    source={INDIA_FLAG_IMAGE}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <AppText className="text-xl">{country.flag}</AppText>
                )}
                <AppText className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {country.dialCode}
                </AppText>
              </AppPressable>

              <AppView
                className="flex-1 h-14 px-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 justify-center"
                style={{ height: 56, justifyContent: 'center' }}
              >
                <TextInput
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="00000 00000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={11}
                  className="w-full font-semibold text-neutral-900 dark:text-neutral-100"
                  style={{
                    fontSize: 16,
                    margin: 0,
                  }}
                />
              </AppView>
            </AppView>

            {validationError && (
              <AppText className="text-xs font-medium text-red-500 mt-1.5 ml-1">
                {validationError}
              </AppText>
            )}

            {/* Continue Button (Black) */}
            <AppView className="mt-4">
              <Button
                label={isLoading ? 'Sending code...' : 'Continue'}
                onPress={handleContinue}
                disabled={cleanPhoneLength < 10 || isLoading}
                loading={isLoading}
                className="bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white rounded-2xl h-14"
                textClassName="text-white dark:text-neutral-950 text-base font-bold"
              />
            </AppView>

            {/* Continue as a Guest */}
            <AppPressable
              onPress={handleContinueAsGuest}
              className="py-3 items-center justify-center mt-2 active:opacity-70"
            >
              <AppText className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Continue as a Guest
              </AppText>
            </AppPressable>

            {/* Subtle Divider */}
            <AppView className="w-full h-px bg-neutral-200 dark:bg-neutral-800 mt-2 mb-4" />

            {/* Language Pill */}
            <LanguagePill language={language} onPress={() => setShowLanguageSheet(true)} />
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>

      {showCountrySheet && (
        <CountryPickerSheet
          isPresented={showCountrySheet}
          selectedCountry={country}
          onSelect={handleCountrySelect}
          onDismiss={() => setShowCountrySheet(false)}
        />
      )}

      {showLanguageSheet && (
        <LanguagePickerSheet
          isPresented={showLanguageSheet}
          selectedLanguage={language}
          onSelect={handleLanguageSelect}
          onDismiss={() => setShowLanguageSheet(false)}
        />
      )}
    </AppSafeAreaView>
  );
}
