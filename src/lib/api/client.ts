import { type AxiosRequestConfig, create } from 'axios';

import { getToken } from '@/lib/auth/utils';
import { mockAdapter } from '@/mocks/adapter';

import { toApiError } from './api-error';
import { API_BASE_URL, IS_MOCK_API, REQUEST_TIMEOUT_MS } from './config';
import type { ApiResponse } from './types';

export const client = create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  ...(IS_MOCK_API ? { adapter: mockAdapter } : {}),
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

/**
 * Sends a request and returns the envelope's `data`, or throws an ApiError.
 * Every endpoint function goes through this.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<ApiResponse<T>>(config);
    return response.data.data;
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.isUnauthorized) onUnauthorized?.();
    throw apiError;
  }
}
