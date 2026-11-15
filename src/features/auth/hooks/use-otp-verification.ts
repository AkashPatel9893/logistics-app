import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';
import { haptics } from '@/lib/haptics';

import { useAuthStore } from '../use-auth-store';
import { goBack } from '@/lib/go-back';

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
  // Bumped on every wrong/incomplete code so the cells shake even for the same message twice.
  const [shakeKey, setShakeKey] = useState(0);

  const showError = (message: string) => {
    setValidationError(message);
    setShakeKey((key) => key + 1);
  };

  // One interval for the whole countdown, not one per tick.
  const isCountingDown = secondsLeft > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const timer = setInterval(() => setSecondsLeft((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isCountingDown]);

  const verify = useMutation({
    mutationFn: (otp: string) => authApi.verifyOtp(phone, otp),
    onSuccess: (session) => {
      haptics.success();
      useAuthStore.getState().signIn(session);
      router.replace(session.user.isOnboarded ? '/home' : '/onboarding');
    },
    onError: (error) => {
      showError(getErrorMessage(error));
      setCode('');
    },
  });

  const resend = useMutation({
    mutationFn: () => authApi.sendOtp(phone),
    onSuccess: (challenge) => {
      setSecondsLeft(challenge.resendInSeconds);
      setCode('');
    },
    onError: (error) => setValidationError(getErrorMessage(error)),
  });

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
    verify.mutate(value);
  };

  const handleResend = () => {
    if (secondsLeft > 0 || resend.isPending) return;
    setValidationError(null);
    resend.mutate();
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
