import { create } from 'zustand';

import { setUnauthorizedHandler } from '@/lib/api/client';
import type { AuthSession, User } from '@/lib/api/models';
import { queryClient } from '@/lib/api/api-provider';
import {
  getToken,
  getUser,
  removeToken,
  setToken,
  setUser as persistUser,
  type TokenType,
} from '@/lib/auth/utils';
import { createSelectors } from '@/lib/create-selectors';

export const DEFAULT_USER_NAME = 'User';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  /** Cached profile; the server (`GET /me`) is the source of truth. */
  user: User | null;
  signIn: (session: AuthSession) => void;
  setUser: (user: User) => void;
  signOut: () => void;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,

  signIn: (session) => {
    const token = { accessToken: session.accessToken, refreshToken: session.refreshToken };
    setToken(token);
    persistUser(session.user);
    set({ status: 'signIn', token, user: session.user });
  },

  setUser: (user) => {
    const updated = { ...user, phone: user.phone ?? get().user?.phone ?? null };
    persistUser(updated);
    set({ user: updated });
  },

  signOut: () => {
    removeToken();
    persistUser(null);
    // Drop every cached server response so the next account starts clean.
    queryClient.cancelQueries();
    queryClient.clear();
    set({ status: 'signOut', token: null, user: null });
  },

  hydrate: () => {
    const token = getToken();
    const user = getUser();
    if (token && user) set({ status: 'signIn', token, user });
    else get().signOut();
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const hydrateAuth = () => _useAuthStore.getState().hydrate();

// An expired/invalid session anywhere in the app returns the user to login.
setUnauthorizedHandler(() => {
  if (_useAuthStore.getState().status === 'signIn') signOut();
});

export function getDisplayName(user: User | null): string {
  return user?.name?.trim() || DEFAULT_USER_NAME;
}
