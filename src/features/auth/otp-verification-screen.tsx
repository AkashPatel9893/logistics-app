import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  OtpInput,
} from '@/components/ui';

import { IS_MOCK_API } from '@/lib/api/config';
import { DEMO_OTP } from '@/mocks/seed';

import { useOtpVerification } from './hooks/use-otp-verification';

interface ResendCodeProps {
  secondsLeft: number;
  isResending: boolean;
  onResend: () => void;
}

function ResendCode({ secondsLeft, isResending, onResend }: ResendCodeProps) {
  return (
    <AppView row className="mt-7 justify-center">
      <AppText className="text-xs text-muted">{"Didn't receive code? "}</AppText>
      {secondsLeft > 0 ? (
        <AppText className="text-xs font-semibold text-brand">
          Resend in 00:{String(secondsLeft).padStart(2, '0')}
        </AppText>
      ) : (
        <AppPressable onPress={onResend} disabled={isResending}>
          <AppText className="text-xs font-bold text-brand underline">Resend OTP</AppText>
        </AppPressable>
      )}
    </AppView>
  );
}

export function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const otp = useOtpVerification();

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <AppKeyboardAvoidingView>
        <AppScrollView
          style={{ paddingTop: insets.top }}
          contentContainerClassName="px-6 pt-3 pb-8"
        >
          <AppView row className="min-h-[54px] gap-3">
            <LiquidGlassBackButton onPress={otp.navigateBack} />
            <AppText accessibilityRole="header" className="text-[22px] font-bold text-foreground">
              Verify OTP
            </AppText>
          </AppView>

          <AppView className="mt-4">
            <AppText className="text-[15px] text-muted">
              {`We've sent a ${otp.otpLength}-digit code to `}
              <AppText className="font-bold text-foreground">{otp.email}</AppText>
            </AppText>
          </AppView>

          {IS_MOCK_API ? (
            <AppText className="mt-2 text-[13px] text-subtle">
              Demo mode: use code {DEMO_OTP}
            </AppText>
          ) : null}

          <AppView className="mt-8 items-center">
            <OtpInput
              length={otp.otpLength}
              value={otp.code}
              onChange={otp.handleCodeChange}
              onComplete={otp.handleVerify}
            />
            {otp.validationError ? (
              <AppText className="mt-1 text-xs font-medium text-error">
                {otp.validationError}
              </AppText>
            ) : null}
            <ResendCode
              secondsLeft={otp.secondsLeft}
              isResending={otp.isResending}
              onResend={otp.handleResend}
            />
          </AppView>

          <AppView className="mt-9">
            <Button
              label={otp.isVerifying ? 'Verifying...' : 'Verify & Proceed'}
              onPress={() => otp.handleVerify()}
              disabled={otp.code.length < otp.otpLength}
              loading={otp.isVerifying}
              textClassName="font-bold"
            />
            <AppPressable
              onPress={otp.navigateBack}
              className="mt-5 items-center justify-center py-3"
            >
              <AppText className="text-sm font-medium text-muted">Edit Email Address</AppText>
            </AppPressable>
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
