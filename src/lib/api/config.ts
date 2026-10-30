import { env } from '@/env';

export const API_BASE_URL = env.API_BASE_URL;

/** Tracking WebSocket endpoint, e.g. wss://api.ryno.app/v1/ws. */
export const WS_URL = env.WS_URL;

export const REQUEST_TIMEOUT_MS = 15_000;
