import { authEndpoints } from '@/data/mock';
import type { LanguageOption } from './types';

export const MOCK_LANGUAGES: LanguageOption[] = authEndpoints.languagesEndpoint.data;

export const MOCK_AUTH_CONFIG = authEndpoints.authConfigEndpoint.data;

export const MOCK_USER = {
  ...authEndpoints.verifyOtpResponse.data.user,
  role: authEndpoints.verifyOtpResponse.data.user.role as 'customer' | 'guest',
};
