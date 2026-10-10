import axios, { type AxiosRequestConfig, create } from 'axios';

import { getToken, setToken } from '../auth/utils';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { toApiError } from './api-error';

export const client = create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  // Tells the shared backend which user pool (customer or driver) a token belongs to.
  headers: { 'Content-Type': 'application/json', 'X-Client-App': 'customer' },
});

// Read the token per request so a new login is picked up immediately.
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token?.accessToken) config.headers.Authorization = `Bearer ${token.accessToken}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;

/** Registered by the auth store: ends the session when the API returns 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const currentToken = getToken();
  if (!currentToken?.refreshToken) return null;

  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: currentToken.refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-App': 'customer',
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    const data = res.data?.data ?? res.data;
    if (data?.access_token) {
      const newToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? currentToken.refreshToken,
      };
      setToken(newToken);
      return data.access_token;
    }
  } catch {
    // refresh failed
  }
  return null;
}

/**
 * Sends a request and returns the envelope's `data`, or throws an ApiError.
 * Every endpoint function goes through this.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<any>(config);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data as T;
  } catch (error) {
    const apiError = toApiError(error);
    const url = config.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/otp') || url.includes('/auth/refresh');

    if (apiError.isUnauthorized && !isAuthEndpoint) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };
        const retryResponse = await client.request<any>(retryConfig);
        if (
          retryResponse.data &&
          typeof retryResponse.data === 'object' &&
          'data' in retryResponse.data
        ) {
          return retryResponse.data.data as T;
        }
        return retryResponse.data as T;
      }
      onUnauthorized?.();
    }
    throw apiError;
  }
}
