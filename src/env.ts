/**
 * Centralized application environment configuration.
 * All process.env reads and default fallbacks belong here exclusively.
 */
export const env = {
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  GOOGLE_MAPS_BASE_URL:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_BASE_URL ?? 'https://maps.googleapis.com',
  GOOGLE_MAPS_WEB_URL: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_URL ?? 'https://maps.google.com',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? null,
} as const;

export type Env = typeof env;
