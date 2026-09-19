import { create } from 'zustand';

import { kvStorage, STORAGE_KEYS } from '@/lib/storage';
import type { TokenType } from '@/lib/auth/utils';
import { getToken, removeToken, setToken } from '@/lib/auth/utils';
import { createSelectors } from '@/lib/utils';

import type { AuthUser } from './types';

export const DEFAULT_GUEST_NAME = 'Guest User';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  user: AuthUser | null;
  signIn: (data: TokenType, user?: AuthUser) => void;
  signOut: () => void;
  hydrate: () => void;
};

function getPersistedUser(): AuthUser | null {
  const raw = kvStorage.getString(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  if (user) {
    kvStorage.setString(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    kvStorage.delete(STORAGE_KEYS.USER);
  }
}

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,
  signIn: (token, user) => {
    const nextUser = user ?? getPersistedUser();
    setToken(token);
    persistUser(nextUser);
    set({ status: 'signIn', token, user: nextUser });
  },
  signOut: () => {
    removeToken();
    persistUser(null);
    set({ status: 'signOut', token: null, user: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn(userToken);
      } else {
        get().signOut();
      }
    } catch (e) {
      console.error(e);
      get().signOut();
    }
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const signIn = (token: TokenType, user?: AuthUser) =>
  _useAuthStore.getState().signIn(token, user);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();

export function getDisplayName(user: AuthUser | null): string {
  return user?.name?.trim() || DEFAULT_GUEST_NAME;
}
