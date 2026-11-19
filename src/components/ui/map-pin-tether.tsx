import { forwardRef, useImperativeHandle, useState } from 'react';
import { Polyline } from 'react-native-maps';

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

export const TETHER_HIDE_ABOVE = 1.2;
export const TETHER_SHOW_BELOW = 0.6;
export const SLOW_FRAME_MS = 22;
export const TETHER_MIN_INTERVAL_MS = 33;

const TETHER_MIN_METRES = 15;
const TETHER_MAX_METRES = 20_000;

export type LiveEnd = MapCoordinate | 'hidden' | null;

export interface TetherHandle {
  setLive: (end: LiveEnd) => void;
}

/** Updates only this polyline during map panning so the host map avoids re-renders. */
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
