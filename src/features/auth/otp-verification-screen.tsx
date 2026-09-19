import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppSafeAreaView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  LiquidGlassBackButton,
  OtpInput,
} from '@/components/ui';

import { useOtpVerification } from './hooks/use-otp-verification';

export function OtpVerificationScreen() {
  const {
    otp,
    setOtp,
    secondsLeft,
    isVerifying,
    isResending,
    validationError,
    setValidationError,
    formattedPhone,
    formatTimer,
    handleVerify,
    handleResend,
    navigateBack,
  } = useOtpVerification();

  const insets = useSafeAreaInsets();
  return (
    <AppSafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <AppKeyboardAvoidingView>
        <AppScrollView
          style={{ paddingTop: insets.top }}
          contentContainerClassName="grow px-6 pt-3 pb-8"
        >
          {/* Header with Back Button and Title */}
          <AppView className="flex-row items-center gap-3 min-h-[54px]">
            <LiquidGlassBackButton onPress={navigateBack} />
            <AppText className="text-[22px] font-bold text-neutral-900 dark:text-neutral-50">
              Verify OTP
            </AppText>
          </AppView>

          <AppView className="mt-4">
            <AppText className="text-[15px] text-neutral-500 dark:text-neutral-400">
              {"We've sent a 4-digit code to "}
              <AppText className="font-bold text-neutral-900 dark:text-neutral-100">
                {formattedPhone}
              </AppText>
            </AppText>
          </AppView>

          <AppView className="mt-8 items-center">
            <OtpInput
              length={4}
              value={otp}
              onChange={(val) => {
                setValidationError(null);
                setOtp(val);
              }}
              onComplete={(completedCode) => handleVerify(completedCode)}
              autoFocus={true}
            />

            {validationError && (
              <AppText className="text-xs font-medium text-red-500 mt-1">{validationError}</AppText>
            )}

            {/* Resend Code */}
            <AppView className="flex-row items-center justify-center mt-7">
              <AppText className="text-xs text-neutral-500 dark:text-neutral-400">
                {"Didn't receive code? "}
              </AppText>
              {secondsLeft > 0 ? (
                <AppText className="text-xs font-semibold text-[#FF5A1F]">
                  Resend in {formatTimer(secondsLeft)}
                </AppText>
              ) : (
                <AppPressable onPress={handleResend} disabled={isResending}>
                  <AppText className="text-xs font-bold text-[#FF5A1F] underline">
                    Resend OTP
                  </AppText>
                </AppPressable>
              )}
            </AppView>
          </AppView>

          <AppView className="mt-9">
            <Button
              label={isVerifying ? 'Verifying...' : 'Verify & Proceed'}
              onPress={() => handleVerify()}
              disabled={otp.length < 4 || isVerifying}
              loading={isVerifying}
              className="bg-[#18181B] dark:bg-white border-[#18181B] dark:border-white rounded-2xl h-14"
              textClassName="text-white dark:text-neutral-950 text-base font-bold"
            />

            <AppPressable
              onPress={navigateBack}
              className="py-3 items-center justify-center mt-5 active:opacity-70"
            >
              <AppText className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Edit Mobile Number
              </AppText>
            </AppPressable>
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>
    </AppSafeAreaView>
  );
}
