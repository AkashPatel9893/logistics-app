/**
 * In-app mock backend. Routes requests to handlers the way the real API would,
 * so screens exercise the same client, auth header, errors and latency.
 */
import { db } from './db';
import { errorBody, HttpError, type MockRequest, type MockResponse } from './http';
import { authRoutes } from './handlers/auth';
import { catalogRoutes } from './handlers/catalog';
import { contentRoutes } from './handlers/content';
import { orderRoutes } from './handlers/orders';
import { placeRoutes } from './handlers/places';
import type { Route } from './handlers/types';
import { walletRoutes } from './handlers/wallet';

const ROUTES: Route[] = [
  ...authRoutes,
  ...catalogRoutes,
  ...placeRoutes,
  ...orderRoutes,
  ...walletRoutes,
  ...contentRoutes,
];

function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    else if (part !== pathParts[i]) return null;
  }
  return params;
}

function userIdFromAuthorization(header: string | undefined): string | null {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  return token ? (db.sessions.get(token)?.userId ?? null) : null;
}

export interface IncomingRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
  authorization?: string;
}

export function handleMockRequest(incoming: IncomingRequest): MockResponse {
  const method = incoming.method.toUpperCase();
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const params = match(route.path, incoming.path);
    if (!params) continue;
    const req: MockRequest = {
      method,
      path: incoming.path,
      params,
      query: incoming.query,
      body: incoming.body,
      userId: userIdFromAuthorization(incoming.authorization),
    };
    try {
      return route.handler(req);
    } catch (error) {
      if (error instanceof HttpError) return errorBody(error);
      console.warn('[mock-api] handler crashed', method, incoming.path, error);
      return errorBody(new HttpError(500, 'INTERNAL', 'Something went wrong. Please try again.'));
    }
  }
  return errorBody(new HttpError(404, 'NOT_FOUND', `No route for ${method} ${incoming.path}`));
}
