import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

export type TokenType = {
  accessToken: string;
  refreshToken: string;
};

export const setToken = (value: TokenType): void => {
  kvStorage.setString(STORAGE_KEYS.TOKEN, JSON.stringify(value));
};

export const getToken = (): TokenType | null => {
  const value = kvStorage.getString(STORAGE_KEYS.TOKEN);
  if (!value) return null;
  try {
    return JSON.parse(value) as TokenType;
  } catch {
    return null;
  }
};

export const removeToken = (): void => {
  kvStorage.delete(STORAGE_KEYS.TOKEN);
};
