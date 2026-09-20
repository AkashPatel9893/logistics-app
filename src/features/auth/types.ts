export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'guest';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
  error?: string;
}
