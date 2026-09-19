import { create } from 'zustand';

import type { TokenType } from '@/lib/auth/utils';
import { getToken, removeToken, setToken } from '@/lib/auth/utils';
import { createSelectors } from '@/lib/utils';

import type { AuthUser } from './types';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  user: AuthUser | null;
  signIn: (data: TokenType, user?: AuthUser) => void;
  signOut: () => void;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,
  signIn: (token, user) => {
    setToken(token);
    set({ status: 'signIn', token, user: user ?? get().user });
  },
  signOut: () => {
    removeToken();
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
