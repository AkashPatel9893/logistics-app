import { deviceInfo } from '@/lib/device';

import { request } from './client';
import { setToken } from '../auth/utils';
import type { AuthSession, LanguageOption, OtpChallenge, UsageType, User } from './models';

/** E.164 form of a 10-digit Indian mobile number (the backend logs in by phone). */
function toPhone(mobile: string): string {
  return `+91${mobile.replace(/\D/g, '').slice(-10)}`;
}

export const authApi = {
  sendOtp: async (identifier: string): Promise<OtpChallenge> => {
    const phone = toPhone(identifier);
    const res = await request<any>({
      method: 'POST',
      url: '/auth/otp/request',
      data: { phone, app_type: 'CUSTOMER' },
    });
    return {
      otpLength: 6,
      resendInSeconds: 30,
      expiresInSeconds: res?.expires_in_seconds ?? 300,
    };
  },

  verifyOtp: async (identifier: string, otp: string): Promise<AuthSession> => {
    const phone = toPhone(identifier);
    const res = await request<any>({
      method: 'POST',
      url: '/auth/otp/verify',
      data: {
        phone,
        app_type: 'CUSTOMER',
        code: otp,
        device: deviceInfo(),
      },
    });
    setToken({ accessToken: res.access_token, refreshToken: res.refresh_token });
    // A first-time user has no customer profile yet; onboarding creates it. Without one the
    // backend refuses quotes and orders, so it must exist before the home screen.
    let profile: any = null;
    try {
      profile = await request<any>({ url: '/customers/me' });
    } catch {
      profile = null;
    }
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user: {
        id: profile?.id ?? res.user?.id ?? '',
        email: '',
        name: profile?.display_name ?? '',
        phone,
        usageType: 'personal',
        isOnboarded: profile !== null,
      },
    };
  },

  getMe: async (signal?: AbortSignal): Promise<User> => {
    try {
      const res = await request<any>({ url: '/customers/me', signal });
      return {
        id: res.id,
        email: res.email ?? '',
        name: res.display_name ?? '',
        phone: res.phone_masked ?? null,
        usageType: 'personal',
        isOnboarded: true,
      };
    } catch {
      return {
        id: 'cust-me',
        email: '',
        name: '',
        phone: null,
        usageType: 'personal',
        isOnboarded: true,
      };
    }
  },

  updateProfile: async (input: {
    name?: string;
    phone?: string;
    usageType?: UsageType;
  }): Promise<User> => {
    const res = await request<any>({
      method: 'PUT',
      url: '/customers/me',
      data: { display_name: input.name, preferred_language: 'en' },
    });
    return {
      id: res.id,
      email: res.email ?? '',
      name: res.display_name ?? input.name,
      // The number the user signed in with; the profile response doesn't carry it.
      phone: input.phone ?? null,
      usageType: 'personal',
      isOnboarded: true,
    };
  },

  getLanguages: async (signal?: AbortSignal): Promise<LanguageOption[]> => {
    try {
      const res = await request<any[]>({ url: '/config/languages', signal });
      if (Array.isArray(res) && res.length > 0) {
        return res.map((l: any) => ({
          code: l.code,
          label: l.label,
          nativeLabel: l.native_label ?? l.nativeLabel ?? l.label,
        }));
      }
    } catch {}
    return [
      { code: 'en', label: 'English', nativeLabel: 'English' },
      { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
      { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
    ];
  },
};
