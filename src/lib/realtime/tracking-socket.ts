/**
 * Live trip transport: one WebSocket per trip (`/ws/trips/{id}`). The first frame is the auth
 * message (tokens never go in the URL); the server then sends a snapshot and live events.
 * Best-effort: on close it reconnects with backoff, and screens keep polling REST as the truth.
 */
import { refreshSessionToken } from '@/lib/api/client';
import { WS_URL } from '@/lib/api/config';
import { getToken } from '@/lib/auth/utils';

import type { TripLiveUpdate, TripSocketEvent } from './events';

type Listener = (update: TripLiveUpdate) => void;

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const PING_EVERY_MS = 30_000;
/** Close code the server uses for a rejected token. */
const UNAUTHORIZED = 4401;
const FINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'FAILED']);

function toUpdate(event: TripSocketEvent): TripLiveUpdate | null {
  switch (event.type) {
    case 'snapshot':
      return event.driver_location
        ? {
            kind: 'position',
            position: {
              latitude: Number(event.driver_location.latitude),
              longitude: Number(event.driver_location.longitude),
            },
          }
        : null;
    case 'location':
      return {
        kind: 'position',
        position: { latitude: Number(event.latitude), longitude: Number(event.longitude) },
      };
    case 'trip_status':
      return { kind: 'status', status: event.status };
    default:
      return null;
  }
}

/** Subscribes to a trip's live updates; returns an unsubscribe function. */
export function subscribeToTrip(tripId: string, listener: Listener): () => void {
  let socket: WebSocket | null = null;
  let retries = 0;
  let stopped = false;
  // An expired access token closes the socket as unauthorized: refresh it once, then reconnect.
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
    const ws = new WebSocket(`${WS_URL}/trips/${tripId}`);
    socket = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      clearPing();
      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, PING_EVERY_MS);
    };
    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as TripSocketEvent;
        retries = 0;
        authRetried = false;
        const update = toUpdate(event);
        if (update) listener(update);
        // Nothing more to follow once the trip is over.
        if (event.type === 'trip_status' && FINAL_STATUSES.has(event.status)) stopped = true;
      } catch {
        // Ignore malformed frames.
      }
    };
    ws.onclose = (event) => {
      if (socket !== ws) return;
      socket = null;
      clearPing();
      if (event.code !== UNAUTHORIZED) {
        scheduleReconnect();
      } else if (!authRetried && !stopped) {
        authRetried = true;
        void refreshSessionToken().then((token) => {
          if (token && !stopped) connect();
        });
      }
    };
    ws.onerror = () => {};
  };

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    clearPing();
    const ws = socket;
    socket = null;
    ws?.close();
  };
}
