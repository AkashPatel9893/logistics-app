const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * No backend yet: without EXPO_PUBLIC_API_URL every request is served by the
 * in-app mock server (src/mocks). Set the URL to talk to a real backend.
 */
export const IS_MOCK_API = !API_URL || process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

export const API_BASE_URL = API_URL ?? 'https://api.ryno.app/v1';

/** Tracking WebSocket endpoint, e.g. wss://api.ryno.app/v1/ws. */
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? null;

export const REQUEST_TIMEOUT_MS = 15_000;
