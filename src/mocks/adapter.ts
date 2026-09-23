import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { handleMockRequest } from './server';

const MIN_LATENCY_MS = 250;
const MAX_LATENCY_MS = 650;

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AxiosError('canceled', AxiosError.ERR_CANCELED));
    });
  });
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data ?? null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function toQuery(params: unknown): Record<string, string> {
  if (!params || typeof params !== 'object') return {};
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

/** Serves requests from the in-app mock server with realistic latency. */
export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await wait(
    MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS),
    config.signal as AbortSignal | undefined,
  );

  // `config.url` is the path relative to baseURL, e.g. "/places/search?q=cp".
  const [path, search = ''] = (config.url ?? '/').split('?');
  const inlineQuery = Object.fromEntries(
    search
      .split('&')
      .filter(Boolean)
      .map((pair) => pair.split('=').map((part) => decodeURIComponent(part)) as [string, string]),
  );
  const response = handleMockRequest({
    method: config.method ?? 'get',
    path,
    query: { ...inlineQuery, ...toQuery(config.params) },
    body: parseBody(config.data),
    authorization: AxiosHeaders.from(config.headers).get('Authorization')?.toString(),
  });

  const axiosResponse: AxiosResponse = {
    data: response.body,
    status: response.status,
    statusText: String(response.status),
    headers: new AxiosHeaders({ 'content-type': 'application/json' }),
    config,
    request: {},
  };

  if (response.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      axiosResponse,
    );
  }
  return axiosResponse;
};
