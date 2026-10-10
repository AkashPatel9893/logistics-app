import { request } from './client';
import { setToken } from '../auth/utils';
import type { AuthSession, LanguageOption, OtpChallenge, UsageType, User } from './models';

function toPhone(identifier: string): string {
  const digits = identifier.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length > 10) {
    return digits.startsWith('91') && digits.length === 12 ? `+${digits}` : `+${digits}`;
  }
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 31 + identifier.charCodeAt(i)) & 0x7fffffff;
  }
  const num = 9000000000 + (hash % 1000000000);
  return `+91${num}`;
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
        device: { device_uuid: 'expo-cust-client-1', platform: 'WEB' },
      },
    });
    const session: AuthSession = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      user: {
        id: res.user?.id ?? 'cust-1',
        email: identifier.includes('@') ? identifier : `${phone.replace('+', '')}@ryno.app`,
        name: 'Customer',
        phone,
        usageType: 'personal',
        isOnboarded: true,
      },
    };
    setToken({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    return session;
  },

  getMe: async (signal?: AbortSignal): Promise<User> => {
    try {
      const res = await request<any>({ url: '/customers/me', signal });
      return {
        id: res.id,
        email: res.email ?? '',
        name: res.display_name ?? 'Customer',
        phone: res.phone_masked ?? null,
        usageType: 'personal',
        isOnboarded: true,
      };
    } catch {
      return {
        id: 'cust-me',
        email: '',
        name: 'Customer',
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
      data: { display_name: input.name ?? 'Customer', preferred_language: 'en' },
    });
    return {
      id: res.id,
      email: res.email ?? '',
      name: res.display_name ?? input.name,
      phone: res.phone_masked ?? null,
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
