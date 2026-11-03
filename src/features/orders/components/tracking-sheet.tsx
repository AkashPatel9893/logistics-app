import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapSheet, useMapSheetHeight } from '@/components/map-sheet';
import { AppView } from '@/components/ui';

/** Fits the status, progress and driver at rest. Everything else is a drag away. */
const RESTING_CONTENT_HEIGHT = 250;
const RESTING_MAX_SHARE = 0.42;

/** Height the sheet covers at rest, so the map can keep the route clear of it. */
export const useTrackingSheetHeight = () =>
  useMapSheetHeight(RESTING_CONTENT_HEIGHT, RESTING_MAX_SHARE);

/** Bottom sheet of the sender and receiver tracking screens. */
export function TrackingSheet({ children }: { children: ReactNode }) {
  const collapsedHeight = useTrackingSheetHeight();
  const insets = useSafeAreaInsets();

  return (
    <MapSheet collapsedHeight={collapsedHeight}>
      <AppView style={{ paddingBottom: insets.bottom + 16 }} className="px-5 pt-1">
        {children}
      </AppView>
    </MapSheet>
  );
}
