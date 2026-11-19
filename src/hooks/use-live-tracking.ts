import { useEffect, useRef, useState } from 'react';

import type { GeoPoint } from '@/lib/api/models';
import { subscribeToTrip } from '@/lib/realtime/tracking-socket';

export function useLiveTracking(
  tripId: string | null,
  onStatusChange?: (status: string) => void,
): { position: GeoPoint; recordedAt: string; stale: boolean } | null {
  const [live, setLive] = useState<{
    tripId: string;
    position: GeoPoint;
    recordedAt: string;
    stale: boolean;
  } | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!tripId) return;
    return subscribeToTrip(tripId, (update) => {
      if (update.kind === 'position')
        setLive({
          tripId,
          position: update.position,
          recordedAt: update.recordedAt,
          stale: update.stale,
        });
      else onStatusChangeRef.current?.(update.status);
    });
  }, [tripId]);

  return live && live.tripId === tripId ? live : null;
}
