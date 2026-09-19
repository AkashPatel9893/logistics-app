import axios from 'axios';

import { getToken } from '@/lib/auth/utils';

// eslint-disable-next-line import/no-named-as-default-member
export const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.logistics.local/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token?.accessToken) {
      config.headers.Authorization = `Bearer ${token.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
