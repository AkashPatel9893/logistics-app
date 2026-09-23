import { TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppSafeAreaView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  Icon,
  LiquidGlassBackButton,
} from '@/components/ui';
import { cn } from '@/lib/cn';

import { useOnboardingForm } from './hooks/use-onboarding-form';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {
    name,
    phone,
    isLoading,
    isFormValid,
    validationErrors,
    handleNameChange,
    handlePhoneChange,
    handleSubmit,
    handleSignOut,
  } = useOnboardingForm();

  return (
    <AppSafeAreaView edges={[]} className="flex-1 bg-[#F9F8F5] dark:bg-neutral-950">
      <AppKeyboardAvoidingView>
        <AppScrollView
          style={{ paddingTop: insets.top + 8 }}
          contentContainerClassName="grow px-6 pb-12"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <AppView className="min-h-[48px] mb-4 justify-center">
            <LiquidGlassBackButton onPress={handleSignOut} />
          </AppView>

          {/* Title and Subtitle */}
          <AppView className="mt-2 mb-6">
            <AppText className="text-[28px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-8">
              Complete your profile
            </AppText>
            <AppText className="text-[14px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-5">
              Set up your account details before heading to the dashboard.
            </AppText>
          </AppView>

          {/* Form Fields */}
          <AppView className="mt-2 gap-4">
            {/* Full Name */}
            <AppView>
              <AppText className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                Full Name <AppText className="text-[#FF5A1F]">*</AppText>
              </AppText>
              <AppView
                className={cn(
                  'h-14 px-4 rounded-2xl bg-white dark:bg-neutral-900 border flex-row items-center',
                  validationErrors.name
                    ? 'border-red-500'
                    : 'border-neutral-200 dark:border-neutral-800',
                )}
              >
                <Icon name="person" size={18} color="#9CA3AF" />
                <TextInput
                  value={name}
                  onChangeText={handleNameChange}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="flex-1 ml-3 font-semibold text-neutral-900 dark:text-neutral-100 text-[15px]"
                />
              </AppView>
              {validationErrors.name && (
                <AppText className="text-xs font-medium text-red-500 mt-1 ml-1">
                  {validationErrors.name}
                </AppText>
              )}
            </AppView>

            {/* Phone Number */}
            <AppView>
              <AppText className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                Phone Number <AppText className="text-[#FF5A1F]">*</AppText>
              </AppText>
              <AppView
                className={cn(
                  'h-14 px-4 rounded-2xl bg-white dark:bg-neutral-900 border flex-row items-center',
                  validationErrors.phone
                    ? 'border-red-500'
                    : 'border-neutral-200 dark:border-neutral-800',
                )}
              >
                <AppView className="flex-row items-center pr-2.5 mr-2.5 border-r border-neutral-200 dark:border-neutral-800">
                  <Icon name="phone" size={16} color="#9CA3AF" />
                  <AppText className="font-bold text-[14px] text-neutral-700 dark:text-neutral-300 ml-1.5">
                    +91
                  </AppText>
                </AppView>
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={15}
                  className="flex-1 font-semibold text-neutral-900 dark:text-neutral-100 text-[15px]"
                />
              </AppView>
              {validationErrors.phone ? (
                <AppText className="text-xs font-medium text-red-500 mt-1 ml-1">
                  {validationErrors.phone}
                </AppText>
              ) : (
                <AppText className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 ml-1">
                  Couriers will call this number for pickup & delivery coordination.
                </AppText>
              )}
            </AppView>
          </AppView>

          {/* Submit Button */}
          <AppView className="mt-8">
            <Button
              label={isLoading ? 'Creating Profile...' : 'Complete Profile & Continue'}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              className="bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white rounded-2xl h-14"
              textClassName="text-white dark:text-neutral-950 text-base font-bold"
            />

            <AppText className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 mt-3 px-4">
              By proceeding, you agree to our Terms of Service & Privacy Policy.
            </AppText>
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>
    </AppSafeAreaView>
  );
}
