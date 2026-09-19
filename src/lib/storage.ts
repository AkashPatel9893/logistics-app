import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createMMKV, type MMKV } from 'react-native-mmkv';

const memoryStore = new Map<string, string>();

export const storage: MMKV = (function () {
  try {
    if (Platform.OS !== 'web') {
      return createMMKV({ id: 'logistics_app_storage' });
    }
  } catch {}
  return {
    getString: (key: string) => memoryStore.get(key),
    set: (key: string, value: string | boolean | number | Uint8Array) =>
      memoryStore.set(key, String(value)),
    remove: (key: string) => memoryStore.delete(key),
    delete: (key: string) => memoryStore.delete(key),
    clearAll: () => memoryStore.clear(),
    getAllKeys: () => Array.from(memoryStore.keys()),
    getBoolean: (key: string) => {
      const v = memoryStore.get(key);
      return v === undefined ? undefined : v === 'true';
    },
    getNumber: (key: string) => {
      const v = memoryStore.get(key);
      return v === undefined ? undefined : Number(v);
    },
    getBuffer: () => undefined,
    contains: (key: string) => memoryStore.has(key),
    addOnValueChangedListener: () => ({ remove: () => {} }),
    recrypt: () => {},
    trim: () => {},
  } as unknown as MMKV;
})();

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? JSON.parse(value) || null : null;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  storage.set(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  storage.remove(key);
}

export const kvStorage = {
  getString: (key: string): string | null => {
    try {
      return storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },

  setString: (key: string, value: string): void => {
    try {
      storage.set(key, value);
    } catch {}
  },

  delete: (key: string): void => {
    try {
      storage.remove(key);
    } catch {}
  },

  getBoolean: (key: string): boolean | undefined => {
    try {
      return storage.getBoolean(key);
    } catch {
      return undefined;
    }
  },

  setBoolean: (key: string, value: boolean): void => {
    try {
      storage.set(key, value);
    } catch {}
  },

  clearAll: (): void => {
    try {
      storage.clearAll();
    } catch {}
  },
};

const TOKEN_KEY = 'auth_session_token';

export const secureStorage = {
  setToken: async (token: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        kvStorage.setString(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch {
      kvStorage.setString(TOKEN_KEY, token);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return kvStorage.getString(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return kvStorage.getString(TOKEN_KEY);
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        kvStorage.delete(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      kvStorage.delete(TOKEN_KEY);
    }
  },
};

export const STORAGE_KEYS = {
  CACHED_PHONE: 'cached_phone_number',
  COUNTRY_ID: 'selected_country_id',
  LANGUAGE_CODE: 'selected_language_code',
  SELECTED_THEME: 'selected_theme',
  IS_FIRST_TIME: 'IS_FIRST_TIME',
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;
