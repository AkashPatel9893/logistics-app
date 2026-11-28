/** Wrong or used-up codes answer 401 too, but the session is fine: never sign out on them. */
const OTP_CODES = new Set(['OTP_INVALID', 'OTP_EXPIRED', 'OTP_ATTEMPTS_EXCEEDED']);

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'unknown';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401 && !OTP_CODES.has(this.code ?? '');
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isErrorNamed(error: unknown, name: string): boolean {
  return isRecord(error) && error.name === name;
}

function getErrorMessageProp(error: unknown): string | null {
  return isRecord(error) && typeof error.message === 'string' ? error.message : null;
}

function formatDetailItem(item: unknown): string {
  if (isRecord(item) && typeof item.msg === 'string' && item.msg.length > 0) {
    return item.msg;
  }
  return JSON.stringify(item) ?? String(item);
}

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

export function toApiError(error: unknown, signal?: AbortSignal): ApiError {
  if (error instanceof ApiError) return error;
  if (signal?.aborted) {
    const reasonMsg = getErrorMessageProp(signal.reason);
    if (
      isErrorNamed(signal.reason, 'TimeoutError') ||
      (reasonMsg !== null && /timeout|timed out/i.test(reasonMsg))
    ) {
      return new ApiError('The request timed out. Check your connection.', 'timeout');
    }
    return new ApiError('Request canceled', 'canceled');
  }
  if (isErrorNamed(error, 'AbortError')) {
    return new ApiError('Request canceled', 'canceled');
  }
  if (isErrorNamed(error, 'TimeoutError')) {
    return new ApiError('The request timed out. Check your connection.', 'timeout');
  }
  if (error instanceof Error) {
    if (/timeout|timed out/i.test(error.message)) {
      return new ApiError('The request timed out. Check your connection.', 'timeout');
    }
    if (/abort|cancel/i.test(error.message)) {
      return new ApiError('Request canceled', 'canceled');
    }
    return new ApiError('No internet connection.', 'network');
  }
  return new ApiError(FALLBACK_MESSAGE, 'unknown');
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
