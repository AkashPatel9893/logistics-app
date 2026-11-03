import BottomSheet, {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { createContext, use, useMemo, type ReactNode } from 'react';
import { LogBox, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppView } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

// Dev-only noise from the library passing dependency arrays, which Reanimated ignores on native.
LogBox.ignoreLogs(['[Reanimated] Dependencies should only be used on the web']);

/** How far the sheet can grow. The rest stays for the header and a slice of map. */
const MAX_HEIGHT_SHARE = 0.85;

// The library only takes component types for these two slots. A new function on every render would
// remount them, so stable components read their current content from here.
const SlotsContext = createContext<{ header?: ReactNode; footer?: ReactNode }>({});

function SheetHandle() {
  const { header } = use(SlotsContext);
  return (
    <AppView>
      <AppView className="items-center py-2.5">
        <AppView className="h-1 w-9 rounded-full bg-border-strong" />
      </AppView>
      {header}
    </AppView>
  );
}

function SheetFooter(props: BottomSheetFooterProps) {
  const { footer } = use(SlotsContext);
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetFooter {...props}>
      <AppView
        collapsable={false}
        style={{ paddingBottom: insets.bottom + 12 }}
        className="border-t border-divider bg-surface px-4 pt-3"
      >
        {footer}
      </AppView>
    </BottomSheetFooter>
  );
}

/** Resting height of a sheet over a map: enough for `content`, never more than `maxShare` of the screen. */
export function useMapSheetHeight(content: number, maxShare: number): number {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
 * Sheet over a map. Dragging grows it up to its content or the height limit, then the content
 * scrolls; dragging down from the top of the content takes it back to rest. Tracks the finger on
 * the UI thread, so it stays smooth while the map and JS are busy.
 */
export function MapSheet({ collapsedHeight, header, footer, children }: MapSheetProps) {
  const { height } = useWindowDimensions();
  const surface = useThemeColor('surface');
  const slots = useMemo(() => ({ header, footer }), [header, footer]);
  const snapPoints = useMemo(() => [collapsedHeight], [collapsedHeight]);

  return (
    <SlotsContext value={slots}>
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing
        maxDynamicContentSize={height * MAX_HEIGHT_SHARE}
        enablePanDownToClose={false}
        enableOverDrag={false}
        // Otherwise the sheet is announced as one element and screen readers can't reach its rows.
        accessible={false}
        handleComponent={SheetHandle}
        footerComponent={footer ? SheetFooter : undefined}
        backgroundStyle={{ backgroundColor: surface, borderRadius: 24 }}
      >
        <BottomSheetScrollView enableFooterMarginAdjustment={Boolean(footer)}>
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </SlotsContext>
  );
}
