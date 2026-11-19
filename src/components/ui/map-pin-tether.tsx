import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Polyline, type Region } from 'react-native-maps';

import { distanceKm } from '@/lib/geo';

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapTether {
  from: MapCoordinate;
  to: MapCoordinate;
  color: string;
}

const TETHER_HIDE_ABOVE = 1.2;
const TETHER_SHOW_BELOW = 0.6;
const SLOW_FRAME_MS = 22;
const TETHER_MIN_INTERVAL_MS = 33;

const TETHER_MIN_METRES = 15;
const TETHER_MAX_METRES = 20_000;

type LiveEnd = MapCoordinate | 'hidden' | null;

interface TetherHandle {
  setLive: (end: LiveEnd) => void;
}

export function usePinTether(enabled: boolean, onMoveStart?: () => void) {
  const tetherRef = useRef<TetherHandle>(null);
  const movingRef = useRef(false);
  const pendingCenterRef = useRef<MapCoordinate | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastSampleRef = useRef<{ region: Region; time: number } | null>(null);
  const lastTetherFrameRef = useRef(0);
  const slowFramesRef = useRef(false);
  const isFastRef = useRef(false);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const trackPan = (region: Region) => {
    if (!movingRef.current) {
      movingRef.current = true;
      lastSampleRef.current = null;
      isFastRef.current = false;
      onMoveStart?.();
    }
    if (!enabled) return;
    const now = Date.now();
    const last = lastSampleRef.current;
    if (last && now > last.time) {
      const screens =
        Math.hypot(
          (region.latitude - last.region.latitude) / (region.latitudeDelta || 1),
          (region.longitude - last.region.longitude) / (region.longitudeDelta || 1),
        ) /
        ((now - last.time) / 1000);
      isFastRef.current = screens > (isFastRef.current ? TETHER_SHOW_BELOW : TETHER_HIDE_ABOVE);
    }
    lastSampleRef.current = { region, time: now };
    pendingCenterRef.current = { latitude: region.latitude, longitude: region.longitude };
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame((frameTime) => {
      frameRef.current = null;
      const sinceLast = frameTime - lastTetherFrameRef.current;
      if (sinceLast < TETHER_MIN_INTERVAL_MS && slowFramesRef.current) return;
      slowFramesRef.current = sinceLast > SLOW_FRAME_MS && sinceLast < 200;
      lastTetherFrameRef.current = frameTime;
      tetherRef.current?.setLive(
        isFastRef.current ? 'hidden' : (pendingCenterRef.current ?? 'hidden'),
      );
    });
  };

  const finishPan = (region: Region) => {
    movingRef.current = false;
    pendingCenterRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (enabled) {
      tetherRef.current?.setLive({ latitude: region.latitude, longitude: region.longitude });
    }
  };

  return { tetherRef, trackPan, finishPan };
}

export const PinTether = forwardRef<TetherHandle, { tether: MapTether }>(function PinTether(
  { tether },
  ref,
) {
  const [live, setLive] = useState<LiveEnd>(null);
  useImperativeHandle(ref, () => ({ setLive }), []);

  if (live === 'hidden') return null;
  const to = live ?? tether.to;
  const metres = distanceKm(tether.from, to) * 1000;
  if (metres < TETHER_MIN_METRES || metres > TETHER_MAX_METRES) return null;

  return (
    <Polyline
      coordinates={[tether.from, to]}
      strokeColor={tether.color}
      strokeWidth={2}
      lineCap="round"
      lineDashPattern={[8, 8]}
    />
  );
});
