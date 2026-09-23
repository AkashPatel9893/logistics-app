import { request } from './client';
import type { AuthSession, LanguageOption, OtpChallenge, UsageType, User } from './models';

export const authApi = {
  sendOtp: (email: string) =>
    request<OtpChallenge>({ method: 'POST', url: '/auth/otp/send', data: { email } }),

  verifyOtp: (email: string, otp: string) =>
    request<AuthSession>({ method: 'POST', url: '/auth/otp/verify', data: { email, otp } }),

  getMe: (signal?: AbortSignal) => request<User>({ url: '/me', signal }),

  updateProfile: (input: { name?: string; phone?: string; usageType?: UsageType }) =>
    request<User>({ method: 'PATCH', url: '/me', data: input }),

  getLanguages: (signal?: AbortSignal) =>
    request<LanguageOption[]>({ url: '/config/languages', signal }),
};
