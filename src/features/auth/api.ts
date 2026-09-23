import { useMutation } from '@tanstack/react-query';

import { MOCK_AUTH_CONFIG } from './mock-data';
import type { AuthResponse } from './types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendOtp(email: string): Promise<AuthResponse> {
  await sleep(600);

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
      error: 'INVALID_EMAIL',
    };
  }

  return {
    success: true,
    message: `OTP sent successfully to ${cleanEmail}. (Use demo OTP: ${MOCK_AUTH_CONFIG.mockOtp})`,
  };
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  await sleep(800);

  const cleanOtp = otp.trim();
  if (cleanOtp.length !== MOCK_AUTH_CONFIG.otpLength) {
    return {
      success: false,
      message: 'Please enter all 4 digits of the OTP.',
      error: 'INCOMPLETE_OTP',
    };
  }

  return {
    success: true,
    message: 'OTP verified successfully!',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'usr_' + Date.now().toString(36),
      email: email.trim().toLowerCase(),
      name: '',
      role: 'customer',
      isOnboarded: false,
    },
  };
}

export async function resendOtp(email: string): Promise<AuthResponse> {
  await sleep(500);

  return {
    success: true,
    message: `New OTP has been sent to ${email}.`,
  };
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => sendOtp(email),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => resendOtp(email),
  });
}
