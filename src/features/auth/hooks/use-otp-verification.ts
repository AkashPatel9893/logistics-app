import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { secureStorage } from '@/lib/storage';
import { useThrottleCallback } from '@/lib/throttle';

import { resendOtp, verifyOtp } from '../api';
import { MOCK_AUTH_CONFIG } from '../mock-data';
import { otpVerificationSchema } from '../schema';
import { signIn } from '../use-auth-store';

export function useOtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams<{ countryCode?: string; phone?: string }>();

  const countryCode = params.countryCode || MOCK_AUTH_CONFIG.defaultCountryCode;
  const rawPhone = params.phone || MOCK_AUTH_CONFIG.defaultPhone;

  const formattedPhone = `${countryCode} ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`;

  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState<number>(MOCK_AUTH_CONFIG.resendCountdownSeconds);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTimer = (sec: number) => {
    const s = sec < 10 ? `0${sec}` : `${sec}`;
    return `00:${s}`;
  };

  const handleVerify = useThrottleCallback(async (codeToVerify = otp) => {
    setValidationError(null);

    const validationResult = otpVerificationSchema.safeParse({
      countryCode,
      phoneNumber: rawPhone,
      otp: codeToVerify,
    });

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message ?? 'Invalid OTP code';
      setValidationError(errorMsg);
      Alert.alert('Incomplete OTP', errorMsg);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtp(countryCode, rawPhone, codeToVerify);
      if (response.success) {
        if (response.token) {
          await secureStorage.setToken(response.token);
          signIn(
            {
              accessToken: response.token,
              refreshToken: 'mock_refresh_token',
            },
            response.user,
          );
        }

        Alert.alert('Success', 'Phone number verified successfully! Welcome to Logistics.');
      } else {
        setValidationError(response.message);
        Alert.alert('Verification Failed', response.message);
      }
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, 1000);

  const handleResend = useThrottleCallback(async () => {
    if (secondsLeft > 0 || isResending) return;

    setIsResending(true);
    setValidationError(null);

    try {
      const response = await resendOtp(countryCode, rawPhone);
      if (response.success) {
        setSecondsLeft(MOCK_AUTH_CONFIG.resendCountdownSeconds);
        setOtp('');
        Alert.alert('Code Sent', response.message);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, 1000);

  return {
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
    navigateBack: () => router.back(),
  };
}
