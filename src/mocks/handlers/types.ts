import type { MockRequest, MockResponse } from '../http';

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Path with `:param` segments, relative to /v1. */
  path: string;
  handler: (req: MockRequest) => MockResponse;
}
