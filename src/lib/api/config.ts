const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = API_URL ?? 'http://localhost:8000/api/v1';

/** Tracking WebSocket endpoint, e.g. wss://api.ryno.app/v1/ws. */
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? null;

export const REQUEST_TIMEOUT_MS = 15_000;
