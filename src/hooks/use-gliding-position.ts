import { useEffect, useRef, useState } from 'react';

import type { GeoPoint } from '@/lib/api/models';

const MIN_GLIDE_MS = 800;
const MAX_GLIDE_MS = 6_000;
const FRAME_MS = 100;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const lerpAngle = (from: number, to: number, t: number) =>
  (from + (((to - from + 540) % 360) - 180) * t + 360) % 360;

export interface GlidingState {
  position: GeoPoint | null;
  heading: number | null;
}

export function useGlidingPosition(
  target: GeoPoint | null,
  targetHeading: number | null = null,
): GlidingState {
  const [shown, setShown] = useState<GlidingState>({ position: target, heading: targetHeading });
  const shownRef = useRef<GlidingState>(shown);
  const lastFixAtRef = useRef(0);

  const latitude = target?.latitude;
  const longitude = target?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      shownRef.current = { position: null, heading: null };
      return;
    }
    const goal = { latitude, longitude };
    const start = shownRef.current.position ?? goal;
    const startHeading = shownRef.current.heading;
    const now = Date.now();
    const gap = lastFixAtRef.current ? now - lastFixAtRef.current : 0;
    lastFixAtRef.current = now;

    const duration = Math.min(Math.max(gap, MIN_GLIDE_MS), MAX_GLIDE_MS);
    const began = now;
    const timer = setInterval(() => {
      const t = Math.min((Date.now() - began) / duration, 1);
      const next: GlidingState = {
        position: {
          latitude: lerp(start.latitude, goal.latitude, t),
          longitude: lerp(start.longitude, goal.longitude, t),
        },
        heading:
          targetHeading === null
            ? startHeading
            : startHeading === null
              ? targetHeading
              : lerpAngle(startHeading, targetHeading, Math.min(t * 2, 1)),
      };
      shownRef.current = next;
      setShown(next);
      if (t >= 1) clearInterval(timer);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [latitude, longitude, targetHeading]);

  return target
    ? { position: shown.position ?? target, heading: shown.heading ?? targetHeading }
    : { position: null, heading: null };
}
