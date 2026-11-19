import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { haptics } from '@/lib/haptics';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useSendOtp, useVerifyOtp } from '@/queries';
import { useAuthStore } from '@/stores';

const DEFAULT_OTP_LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 30;

export function useOtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; otpLength?: string; resendIn?: string }>();
  const phone = params.phone ?? '';
  const otpLength = Number(params.otpLength) || DEFAULT_OTP_LENGTH;

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(
    () => Number(params.resendIn) || DEFAULT_RESEND_SECONDS,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const showError = (message: string) => {
    setValidationError(message);
    setShakeKey((key) => key + 1);
  };

  const isCountingDown = secondsLeft > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const timer = setInterval(() => setSecondsLeft((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isCountingDown]);

  const verify = useVerifyOtp();
  const resend = useSendOtp();

  const handleCodeChange = (value: string) => {
    setValidationError(null);
    setCode(value);
  };

  const handleVerify = (value: string = code) => {
    if (verify.isPending) return;
    if (value.length !== otpLength) {
      showError(`Enter all ${otpLength} digits of the code`);
      return;
    }
    verify.mutate(
      { phone, otp: value },
      {
        onSuccess: (session) => {
          haptics.success();
          useAuthStore.getState().signIn(session);
          router.replace(session.user.isOnboarded ? '/home' : '/onboarding');
        },
        onError: (error) => {
          showError(getErrorMessage(error));
          setCode('');
        },
      },
    );
  };

  const handleResend = () => {
    if (secondsLeft > 0 || resend.isPending) return;
    setValidationError(null);
    resend.mutate(phone, {
      onSuccess: (challenge) => {
        setSecondsLeft(challenge.resendInSeconds);
        setCode('');
      },
      onError: (error) => setValidationError(getErrorMessage(error)),
    });
  };

  return {
    phone,
    otpLength,
    code,
    handleCodeChange,
    secondsLeft,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    validationError,
    shakeKey,
    handleVerify,
    handleResend,
    navigateBack: () => goBack(router),
  };
}
