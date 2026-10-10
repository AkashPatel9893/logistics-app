import { isAxiosError, isCancel } from 'axios';

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'unknown';

/** Normalized error for every failed API call. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
    /** Machine-readable code from the backend, e.g. "INVALID_COUPON". */
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return new ApiError('Request canceled', 'canceled');
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. Check your connection.', 'timeout');
    }
    const payload = error.response?.data as any;
    if (error.response) {
      const detail = payload?.detail;
      const detailMsg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
            : null;
      return new ApiError(
        detailMsg ?? payload?.message ?? FALLBACK_MESSAGE,
        'http',
        error.response.status,
        payload?.error ?? payload?.code ?? null,
      );
    }
    return new ApiError('No internet connection.', 'network');
  }
  return new ApiError(FALLBACK_MESSAGE, 'unknown');
}

/** User-facing message for any error thrown by a query or mutation. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
