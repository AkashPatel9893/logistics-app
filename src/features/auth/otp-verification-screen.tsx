import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppPressable,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  OtpInput,
} from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { enterFromBelow } from '@/lib/motion';

import { useOtpVerification } from './hooks/use-otp-verification';

interface ResendCodeProps {
  secondsLeft: number;
  isResending: boolean;
  onResend: () => void;
}

function ResendCode({ secondsLeft, isResending, onResend }: ResendCodeProps) {
  return (
    <AppView row className="mt-4 justify-center">
      <AppText className="text-xs text-muted">{"Didn't receive code? "}</AppText>
      {secondsLeft > 0 ? (
        <AppText className="text-xs font-semibold tabular-nums text-brand">
          Resend in 00:{String(secondsLeft).padStart(2, '0')}
        </AppText>
      ) : (
        <AppPressable
          onPress={() => {
            haptics.tap();
            onResend();
          }}
          disabled={isResending}
          accessibilityLabel="Resend OTP"
        >
          <AppText className="text-xs font-bold text-brand underline">
            {isResending ? 'Sending...' : 'Resend OTP'}
          </AppText>
        </AppPressable>
      )}
    </AppView>
  );
}

export function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const otp = useOtpVerification();
  const hasError = otp.validationError !== null;

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <KeyboardAwareScrollView
        // Scrolls in step with the keyboard animation; the offset keeps Verify visible.
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
      >
        <AppView row className="min-h-[54px] gap-3">
          <LiquidGlassBackButton onPress={otp.navigateBack} />
          <AppText accessibilityRole="header" className="text-[22px] font-bold text-foreground">
            Verify OTP
          </AppText>
        </AppView>

        <AnimatedView entering={enterFromBelow(0)} className="mt-3">
          <AppText className="text-[15px] text-muted">
            {`We've sent a ${otp.otpLength}-digit code to `}
            <AppText className="font-bold text-foreground">
              +91 {otp.phone.slice(0, 5)} {otp.phone.slice(5)}
            </AppText>
          </AppText>
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(1)} className="mt-6">
          <OtpInput
            length={otp.otpLength}
            value={otp.code}
            onChange={otp.handleCodeChange}
            onComplete={otp.handleVerify}
            hasError={hasError}
            shakeKey={otp.shakeKey}
          />
          {/* Fixed height so the error appearing never pushes the layout. */}
          <AppView className="min-h-[18px] items-center justify-center">
            {otp.validationError ? (
              <AnimatedView entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
                <AppText className="text-[13px] font-medium text-error">
                  {otp.validationError}
                </AppText>
              </AnimatedView>
            ) : null}
          </AppView>
          <ResendCode
            secondsLeft={otp.secondsLeft}
            isResending={otp.isResending}
            onResend={otp.handleResend}
          />
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(2)} className="mt-6">
          <Button
            label={otp.isVerifying ? 'Verifying...' : 'Verify & Proceed'}
            onPress={() => otp.handleVerify()}
            disabled={otp.code.length < otp.otpLength}
            loading={otp.isVerifying}
            textClassName="font-bold"
          />
          <AppPressable
            onPress={otp.navigateBack}
            className="mt-4 items-center justify-center py-3"
          >
            <AppText className="text-sm font-medium text-muted">Edit Mobile Number</AppText>
          </AppPressable>
          <AppPressable
            onPress={otp.navigateBack}
            className="mt-4 items-center justify-center py-3"
          >
            <AppText className="text-sm font-medium text-muted">Edit Mobile Number</AppText>
          </AppPressable>
        </AnimatedView>
      </KeyboardAwareScrollView>
    </AppView>
  );
}
