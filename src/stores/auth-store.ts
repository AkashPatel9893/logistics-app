import { create } from 'zustand';

import { clearLocalRecentAddresses } from '@/features/trip/hooks/use-address-search';
import { authApi } from '@/lib/api/auth';
import { setUnauthorizedHandler } from '@/lib/api/client';
import type { AuthSession, User } from '@/lib/api/models';
import {
  getToken,
  getUser,
  removeToken,
  setToken,
  setUser as persistUser,
  type TokenType,
} from '@/lib/auth/utils';
import { queryClient } from '@/queries/query-client';

import { useTripStore } from './trip-store';

export const DEFAULT_USER_NAME = 'User';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
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
    queryClient.cancelQueries();
    queryClient.clear();
    clearLocalRecentAddresses();
    useTripStore.getState().reset();
    set({ status: 'signOut', token: null, user: null });
  },

  hydrate: () => {
    const token = getToken();
    const user = getUser();
    if (token && user) set({ status: 'signIn', token, user });
    else get().signOut();
  },
}));

export const useAuthStore = _useAuthStore;

export const signOut = () => _useAuthStore.getState().signOut();

/**
 * The customer logs out: end the session on the server too, then here. (signOut alone is for a
 * session the server already refused.)
 */
export function logOut() {
  const accessToken = _useAuthStore.getState().token?.accessToken;
  if (accessToken) void authApi.endSession(accessToken);
  signOut();
}
export const hydrateAuth = () => _useAuthStore.getState().hydrate();

setUnauthorizedHandler(() => {
  if (_useAuthStore.getState().status === 'signIn') signOut();
});

export function getDisplayName(user: User | null): string {
  return user?.name?.trim() || DEFAULT_USER_NAME;
}
