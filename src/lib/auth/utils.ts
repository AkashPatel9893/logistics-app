import type { User } from '../api/models';
import { kvStorage, STORAGE_KEYS } from '../storage';

export type TokenType = {
  accessToken: string;
  refreshToken: string;
};

let sessionVersion = 0;

/** Changes whenever a session is started or ended, but not when its token is refreshed. */
export const getSessionVersion = (): number => sessionVersion;

export const setToken = (value: TokenType): void => {
  sessionVersion += 1;
  kvStorage.setString(STORAGE_KEYS.TOKEN, JSON.stringify(value));
};

/** Store refreshed credentials only while the originating session is still active. */
export const setRefreshedToken = (value: TokenType, version: number): boolean => {
  if (version !== sessionVersion) return false;
  kvStorage.setString(STORAGE_KEYS.TOKEN, JSON.stringify(value));
  return true;
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
  sessionVersion += 1;
  kvStorage.delete(STORAGE_KEYS.TOKEN);
};

export const getUser = (): User | null => {
  const value = kvStorage.getString(STORAGE_KEYS.USER);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const setUser = (value: User | null): void => {
  if (value) kvStorage.setString(STORAGE_KEYS.USER, JSON.stringify(value));
  else kvStorage.delete(STORAGE_KEYS.USER);
};
