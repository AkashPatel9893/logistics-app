import { useEffect, useRef, useState } from 'react';

import type { DriverLocation } from '@/lib/api/models';
import type { TrackingEvent } from '@/lib/realtime/events';
import { subscribeToTracking } from '@/lib/realtime/tracking-socket';

/**
 * Subscribes to a tracking channel while mounted. Returns the latest driver
 * location; status changes go to `onStatusChange` (typically a cache refetch).
 */
export function useLiveTracking(
  channel: string | null,
  onStatusChange?: (event: Extract<TrackingEvent, { type: 'order.status' }>) => void,
): DriverLocation | null {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!channel) return;
    return subscribeToTracking(channel, (event) => {
      if (event.type === 'driver.location') {
        const { type: _type, ...next } = event;
        setLocation(next);
      } else {
        // The driver stops being tracked once the order leaves the road.
        if (event.status === 'delivered' || event.status === 'cancelled') setLocation(null);
        onStatusChangeRef.current?.(event);
      }
    });
  }, [channel]);

  return location;
}
