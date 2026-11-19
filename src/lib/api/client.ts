import { fetch } from 'react-native-nitro-fetch';

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/config/env';

import { getSessionVersion, getToken, setRefreshedToken } from '../auth/utils';
import { parseHttpPayloadError, toApiError } from './api-error';

export interface ApiRequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Client-App': 'customer',
} as const;

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

let refresh: { version: number; promise: Promise<string | null> } | null = null;

function formatQueryValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value) ?? null;
}

function serializeParams(params: Record<string, unknown>): string {
  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    const encodedKey = encodeURIComponent(key);
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const formatted = formatQueryValue(item);
        if (formatted !== null) {
          pairs.push(`${encodedKey}=${encodeURIComponent(formatted)}`);
        }
      }
    } else {
      const formatted = formatQueryValue(raw);
      if (formatted !== null) {
        pairs.push(`${encodedKey}=${encodeURIComponent(formatted)}`);
      }
    }
  }
  return pairs.join('&');
}

function buildUrl(url?: string, params?: Record<string, unknown>): string {
  const path = url ?? '';
  let fullUrl: string;
  if (/^https?:\/\//i.test(path)) {
    fullUrl = path;
  } else {
    const base = API_BASE_URL.replace(/\/+$/, '');
    const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    fullUrl = `${base}${suffix}`;
  }

  if (!params) return fullUrl;
  const query = serializeParams(params);
  if (!query) return fullUrl;
  const separator = fullUrl.includes('?')
    ? fullUrl.endsWith('?') || fullUrl.endsWith('&')
      ? ''
      : '&'
    : '?';
  return `${fullUrl}${separator}${query}`;
}

function setHeaderCaseInsensitive(
  headers: Record<string, string>,
  name: string,
  value: string,
): void {
  const lower = name.toLowerCase();
  for (const existing of Object.keys(headers)) {
    if (existing.toLowerCase() === lower) {
      delete headers[existing];
    }
  }
  headers[name] = value;
}

function buildRequestHeaders(
  customHeaders?: Record<string, string>,
  accessTokenOverride?: string,
  isFormData = false,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Client-App': DEFAULT_HEADERS['X-Client-App'],
  };
  if (!isFormData) {
    headers['Content-Type'] = DEFAULT_HEADERS['Content-Type'];
  }
  const token = getToken();
  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;
  }
  if (customHeaders) {
    for (const [key, value] of Object.entries(customHeaders)) {
      if (value !== undefined) {
        setHeaderCaseInsensitive(headers, key, value);
      }
    }
  }
  if (accessTokenOverride) {
    setHeaderCaseInsensitive(headers, 'Authorization', `Bearer ${accessTokenOverride}`);
  }
  return headers;
}

function serializeBody(method: string, data: unknown): BodyInit | undefined {
  if (data === undefined || data === null) return undefined;
  if (method.toUpperCase() === 'GET') return undefined;
  if (typeof data === 'string') return data;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) return data;
  if (
    typeof ArrayBuffer !== 'undefined' &&
    (data instanceof ArrayBuffer || ArrayBuffer.isView(data))
  ) {
    return data as BodyInit;
  }
  return JSON.stringify(data);
}

function unwrapData<T>(payload: unknown): T {
  if (payload !== null && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function parseResponseBody(res: Response, signal?: AbortSignal): Promise<unknown> {
  if (res.status === 204 || res.status === 205) return null;
  let text: string;
  try {
    text = await res.text();
  } catch (error) {
    throw toApiError(error, signal);
  }
  if (text.trim() === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function executeRequest<T>(
  config: ApiRequestConfig,
  accessTokenOverride?: string,
): Promise<T> {
  if (config.signal?.aborted) {
    throw toApiError(config.signal.reason, config.signal);
  }
  const url = buildUrl(config.url, config.params);
  const method = config.method ?? 'GET';
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  const headers = buildRequestHeaders(config.headers, accessTokenOverride, isFormData);
  const body = serializeBody(method, config.data);
  const timeoutMs = config.timeout ?? REQUEST_TIMEOUT_MS;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      signal: config.signal,
      timeoutMs,
    });
  } catch (error) {
    throw toApiError(error, config.signal);
  }

  const payload = await parseResponseBody(res, config.signal);
  if (!res.ok) {
    throw parseHttpPayloadError(res.status, payload);
  }
  return unwrapData<T>(payload);
}

async function refreshAccessToken(version: number): Promise<string | null> {
  const currentToken = getToken();
  if (!currentToken?.refreshToken) return null;

  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ refresh_token: currentToken.refreshToken }),
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    if (!res.ok) return null;
    const payload = await parseResponseBody(res);
    const data = unwrapData<Record<string, unknown> | null>(payload);
    const accessToken =
      data !== null && typeof data === 'object' && typeof data.access_token === 'string'
        ? data.access_token
        : null;
    if (accessToken) {
      const refreshToken =
        typeof data?.refresh_token === 'string' && data.refresh_token.length > 0
          ? data.refresh_token
          : currentToken.refreshToken;
      const newToken = { accessToken, refreshToken };
      return setRefreshedToken(newToken, version) ? accessToken : null;
    }
  } catch {}
  return null;
}

export function refreshSessionToken(): Promise<string | null> {
  const version = getSessionVersion();
  if (!refresh || refresh.version !== version) {
    const pending = refreshAccessToken(version);
    refresh = { version, promise: pending };
    void pending.finally(() => {
      if (refresh?.promise === pending) refresh = null;
    });
  }
  return refresh.promise;
}

export async function request<T>(config: ApiRequestConfig): Promise<T> {
  const version = getSessionVersion();
  try {
    return await executeRequest<T>(config);
  } catch (error) {
    const apiError = toApiError(error, config.signal);
    const url = config.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/otp') || url.includes('/auth/refresh');

    if (apiError.isUnauthorized && !isAuthEndpoint && version === getSessionVersion()) {
      const newAccessToken = await refreshSessionToken();
      if (version !== getSessionVersion()) throw apiError;
      if (newAccessToken) {
        try {
          return await executeRequest<T>(config, newAccessToken);
        } catch (retryError) {
          const normalized = toApiError(retryError, config.signal);
          if (normalized.isUnauthorized && version === getSessionVersion()) onUnauthorized?.();
          throw normalized;
        }
      }
      onUnauthorized?.();
    }
    throw apiError;
  }
}
