import type { ReactNode } from 'react';

import { MapSheet, useMapSheetHeight } from '@/components/map-sheet';
import { AppView } from '@/components/ui';

const RESTING_CONTENT_HEIGHT = 250;
const RESTING_MAX_SHARE = 0.42;

export const useTrackingSheetHeight = () =>
  useMapSheetHeight(RESTING_CONTENT_HEIGHT, RESTING_MAX_SHARE);

export function TrackingSheet({ children }: { children: ReactNode }) {
  const collapsedHeight = useTrackingSheetHeight();

  return (
    <MapSheet collapsedHeight={collapsedHeight}>
      <AppView className="px-5 pb-safe-offset-4 pt-1">{children}</AppView>
    </MapSheet>
  );
}
