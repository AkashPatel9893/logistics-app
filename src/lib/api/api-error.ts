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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatDetailItem(item: unknown): string {
  if (isRecord(item) && typeof item.msg === 'string' && item.msg.length > 0) {
    return item.msg;
  }
  return JSON.stringify(item) ?? String(item);
}

/** Normalizes an HTTP error response payload into an `ApiError`. */
export function parseHttpPayloadError(status: number, payload: unknown): ApiError {
  const data = isRecord(payload) ? payload : null;
  const detail = data?.detail;
  let detailMsg: string | null = null;
  if (typeof detail === 'string' && detail.length > 0) {
    detailMsg = detail;
  } else if (Array.isArray(detail) && detail.length > 0) {
    const formatted = detail.map(formatDetailItem).filter(Boolean).join(', ');
    if (formatted.length > 0) detailMsg = formatted;
  }

  const message =
    typeof data?.message === 'string' && data.message.length > 0 ? data.message : null;
  const code =
    (typeof data?.error === 'string' && data.error.length > 0 ? data.error : null) ??
    (typeof data?.code === 'string' && data.code.length > 0 ? data.code : null);

  return new ApiError(detailMsg ?? message ?? FALLBACK_MESSAGE, 'http', status, code);
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new ApiError('Request canceled', 'canceled');
    }
    if (error.name === 'TimeoutError' || /timeout|timed out/i.test(error.message)) {
      return new ApiError('The request timed out. Check your connection.', 'timeout');
    }
    if (/abort|cancel/i.test(error.message)) {
      return new ApiError('Request canceled', 'canceled');
    }
    return new ApiError('No internet connection.', 'network');
  }
  return new ApiError(FALLBACK_MESSAGE, 'unknown');
}

/** User-facing message for any error thrown by a query or mutation. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
