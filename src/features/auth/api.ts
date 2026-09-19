import { useMutation } from '@tanstack/react-query';

import { MOCK_AUTH_CONFIG } from './mock-data';
import type { AuthResponse } from './types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendOtp(countryCode: string, phoneNumber: string): Promise<AuthResponse> {
  await sleep(600);

  const cleanPhone = phoneNumber.replace(/\s+/g, '');
  if (!cleanPhone || cleanPhone.length < 7) {
    return {
      success: false,
      message: 'Please enter a valid mobile number.',
      error: 'INVALID_PHONE',
    };
  }

  return {
    success: true,
    message: `OTP sent successfully to ${countryCode} ${cleanPhone}. (Use demo OTP: ${MOCK_AUTH_CONFIG.mockOtp})`,
  };
}

export async function verifyOtp(
  countryCode: string,
  phoneNumber: string,
  otp: string,
): Promise<AuthResponse> {
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
      phone: phoneNumber,
      countryCode,
      name: 'Logistics User',
      role: 'customer',
    },
  };
}

export async function resendOtp(countryCode: string, phoneNumber: string): Promise<AuthResponse> {
  await sleep(500);

  return {
    success: true,
    message: `New OTP has been sent to ${countryCode} ${phoneNumber}.`,
  };
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: ({ countryCode, phoneNumber }: { countryCode: string; phoneNumber: string }) =>
      sendOtp(countryCode, phoneNumber),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: ({
      countryCode,
      phoneNumber,
      otp,
    }: {
      countryCode: string;
      phoneNumber: string;
      otp: string;
    }) => verifyOtp(countryCode, phoneNumber, otp),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: ({ countryCode, phoneNumber }: { countryCode: string; phoneNumber: string }) =>
      resendOtp(countryCode, phoneNumber),
  });
}
