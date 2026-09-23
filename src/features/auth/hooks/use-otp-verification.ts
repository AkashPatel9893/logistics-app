import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';

import { useAuthStore } from '../use-auth-store';

const DEFAULT_OTP_LENGTH = 4;
const DEFAULT_RESEND_SECONDS = 30;

export function useOtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; otpLength?: string; resendIn?: string }>();
  const email = params.email ?? '';
  const otpLength = Number(params.otpLength) || DEFAULT_OTP_LENGTH;

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(
    () => Number(params.resendIn) || DEFAULT_RESEND_SECONDS,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // One interval for the whole countdown, not one per tick.
  const isCountingDown = secondsLeft > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const timer = setInterval(() => setSecondsLeft((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isCountingDown]);

  const verify = useMutation({
    mutationFn: (otp: string) => authApi.verifyOtp(email, otp),
    onSuccess: (session) => {
      useAuthStore.getState().signIn(session);
      router.replace(session.user.isOnboarded ? '/home' : '/onboarding');
    },
    onError: (error) => {
      setValidationError(getErrorMessage(error));
      setCode('');
    },
  });

  const resend = useMutation({
    mutationFn: () => authApi.sendOtp(email),
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
      setValidationError(`Enter all ${otpLength} digits of the code`);
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
    email,
    otpLength,
    code,
    handleCodeChange,
    secondsLeft,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    validationError,
    handleVerify,
    handleResend,
    navigateBack: () => router.back(),
  };
}
