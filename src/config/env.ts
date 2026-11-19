export const env = {
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? null,
  BUSINESS_ENQUIRY_URL:
    process.env.EXPO_PUBLIC_BUSINESS_URL ?? 'https://www.54-252-167-25.sslip.io/business',
} as const;

export const API_BASE_URL = env.API_BASE_URL;

export const WS_URL = env.WS_URL;

export const REQUEST_TIMEOUT_MS = 15_000;

export type Env = typeof env;
