import { useState, type ReactNode } from 'react';

import {
  AppBottomSheet,
  AppScrollView,
  AppView,
  useAppSafeAreaInsets,
  type Detent,
} from '@/components/ui';
import { useWindowDimensions } from '@/lib/native';

/** Resting height of a sheet over a map: enough for `content`, never more than `maxShare` of the screen. */
export function useMapSheetHeight(content: number, maxShare: number): number {
  const { height } = useWindowDimensions();
  const insets = useAppSafeAreaInsets();
  return Math.min(content + insets.bottom, height * maxShare);
}

export interface MapSheetProps {
  /** Height at rest; see `useMapSheetHeight`. */
  collapsedHeight: number;
  /** Stays above the scrolling content and can be dragged like the handle. */
  header?: ReactNode;
  /** Stays pinned to the bottom of the screen at any height. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Sheet over a map. Dragging grows it up to `'85%'` of the screen, then the content scrolls;
 * dragging down from the top of the content takes it back to rest. Runs natively via
 * `@swmansion/react-native-bottom-sheet`.
 */
export function MapSheet({ collapsedHeight, header, footer, children }: MapSheetProps) {
  const [index, setIndex] = useState(0);
  const detents: Detent[] = [collapsedHeight, '85%'];

  return (
    <AppBottomSheet index={index} onIndexChange={setIndex} detents={detents}>
      <AppView className="flex-1">
        <AppView className="items-center py-2.5">
          <AppView className="h-1 w-9 rounded-full bg-border-strong" />
        </AppView>
        {header}
        <AppScrollView className="flex-1">{children}</AppScrollView>
        {footer ? (
          <AppView
            collapsable={false}
            className="border-t border-divider bg-surface px-4 pb-safe-offset-3 pt-3"
          >
            {footer}
          </AppView>
        ) : null}
      </AppView>
    </AppBottomSheet>
  );
}
