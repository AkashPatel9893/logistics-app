import { NitroWebSocket } from 'react-native-nitro-websockets';

import { WS_URL } from '@/config/env';
import { onTokenRefreshed, refreshSessionToken } from '@/lib/api/client';
import { getToken } from '@/lib/auth/utils';

import type { TripLiveUpdate, TripSocketEvent } from './events';

type Listener = (update: TripLiveUpdate) => void;

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const PING_EVERY_MS = 30_000;
const UNAUTHORIZED = 4401;
const FINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'FAILED']);

function toUpdate(event: TripSocketEvent): TripLiveUpdate | null {
  switch (event.type) {
    case 'snapshot':
      return event.driver_location
        ? {
            kind: 'position',
            recordedAt: event.driver_location.recorded_at,
            stale: event.driver_location.stale,
            position: {
              latitude: Number(event.driver_location.latitude),
              longitude: Number(event.driver_location.longitude),
            },
          }
        : null;
    case 'location':
      return {
        kind: 'position',
        recordedAt: event.recorded_at,
        stale: false,
        position: { latitude: Number(event.latitude), longitude: Number(event.longitude) },
      };
    case 'trip_status':
      return { kind: 'status', status: event.status };
    default:
      return null;
  }
}

export function subscribeToTrip(tripId: string, listener: Listener): () => void {
  let socket: NitroWebSocket | null = null;
  let retries = 0;
  let stopped = false;
  let authRetried = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;

  const clearPing = () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** retries);
    retries += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const connect = () => {
    const token = getToken()?.accessToken;
    if (stopped || !WS_URL || !token) return;
    const ws = new NitroWebSocket(`${WS_URL}/trips/${tripId}`);
    socket = ws;

    ws.onopen = () => {
      if (stopped || socket !== ws) return;
      ws.send(JSON.stringify({ type: 'auth', token }));
      clearPing();
      pingTimer = setInterval(() => {
        if (ws.readyState === 'OPEN') ws.send(JSON.stringify({ type: 'ping' }));
      }, PING_EVERY_MS);
    };
    ws.onmessage = (message) => {
      if (stopped || socket !== ws || message.isBinary) return;
      try {
        const event = JSON.parse(message.data) as TripSocketEvent;
        retries = 0;
        authRetried = false;
        const update = toUpdate(event);
        if (update) listener(update);
        if (event.type === 'trip_status' && FINAL_STATUSES.has(event.status)) stopped = true;
      } catch {}
    };
    ws.onclose = (event) => {
      if (socket !== ws) return;
      socket = null;
      clearPing();
      if (event.code !== UNAUTHORIZED) {
        scheduleReconnect();
      } else if (!authRetried && !stopped) {
        authRetried = true;
        void refreshSessionToken().then((refreshedToken) => {
          if (refreshedToken && !stopped) connect();
        });
      }
    };
    ws.onerror = () => {};
  };

  // The backend closes a socket with 4401 once its access token is no longer valid; sending the new
  // token after every refresh keeps it open (it answers {"type":"reauthenticated"}).
  const stopListening = onTokenRefreshed((accessToken) => {
    const ws = socket;
    if (!stopped && ws && ws.readyState === 'OPEN') {
      ws.send(JSON.stringify({ type: 'auth', token: accessToken }));
    }
  });

  connect();

  return () => {
    stopped = true;
    stopListening();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    clearPing();
    const ws = socket;
    socket = null;
    ws?.close(1000, 'Unsubscribed');
  };
}
