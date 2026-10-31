import { useEffect, useRef, useState } from 'react';

import type { GeoPoint } from '@/lib/api/models';
import { subscribeToTrip } from '@/lib/realtime/tracking-socket';

/**
 * Follows a trip over the socket while mounted. Returns the driver's latest pushed position;
 * a status change goes to `onStatusChange` (typically a cache refetch).
 */
export function useLiveTracking(
  tripId: string | null,
  onStatusChange?: (status: string) => void,
): GeoPoint | null {
  const [live, setLive] = useState<{ tripId: string; position: GeoPoint } | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!tripId) return;
    return subscribeToTrip(tripId, (update) => {
      if (update.kind === 'position') setLive({ tripId, position: update.position });
      else onStatusChangeRef.current?.(update.status);
    });
  }, [tripId]);

  // A position pushed for an earlier trip is not this trip's.
  return live && live.tripId === tripId ? live.position : null;
}
