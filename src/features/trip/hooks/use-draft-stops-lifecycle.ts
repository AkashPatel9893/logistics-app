import { useEffect, useRef } from 'react';

import { draftStops, useTripStore } from '@/stores';

export function useDraftStopsLifecycle(mode: 'add' | 'edit' | undefined, maxDrops: number) {
  const hasPrepared = useRef(false);

  useEffect(() => {
    if (hasPrepared.current) return;
    hasPrepared.current = true;
    const trip = useTripStore.getState();
    const count = draftStops(trip.draft).length;
    if (mode === 'add' ? count < maxDrops : mode !== 'edit' && count < 2) trip.addStop();
  }, [mode, maxDrops]);

  useEffect(
    () => () => {
      const trip = useTripStore.getState();
      let remaining = draftStops(trip.draft);
      for (let index = remaining.length - 1; index >= 0 && remaining.length > 1; index--) {
        if (remaining[index].region) continue;
        trip.removeStop(index);
        remaining = draftStops(useTripStore.getState().draft);
      }
    },
    [],
  );
}
