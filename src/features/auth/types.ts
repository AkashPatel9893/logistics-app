export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'guest';
  usageType?: 'personal' | 'business';
  isOnboarded?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  error?: string;
}
