/** Minimal HTTP primitives for the in-app mock server. */

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** Resolved from the bearer token; null for anonymous requests. */
  userId: string | null;
}

export interface MockResponse {
  status: number;
  body: unknown;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, message = 'OK', status = 200): MockResponse {
  return {
    status,
    body: { success: true, statusCode: status, message, data, timestamp: new Date().toISOString() },
  };
}

export function created<T>(data: T, message = 'Created'): MockResponse {
  return ok(data, message, 201);
}

export function errorBody(error: HttpError): MockResponse {
  return {
    status: error.status,
    body: {
      success: false,
      statusCode: error.status,
      error: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    },
  };
}

export function requireUser(req: MockRequest): string {
  if (!req.userId) throw new HttpError(401, 'UNAUTHORIZED', 'Please log in again.');
  return req.userId;
}

/** Reads a typed JSON body, rejecting missing/invalid payloads with 400. */
export function body<T extends object>(req: MockRequest): T {
  if (!req.body || typeof req.body !== 'object') {
    throw new HttpError(400, 'INVALID_BODY', 'Request body is required.');
  }
  return req.body as T;
}

export function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function randomDigits(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
