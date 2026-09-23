import type { ReactNode } from 'react';
import { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedView, AppScrollView, AppView } from '@/components/ui';
import { DURATION, SHEET_EASE } from '@/lib/motion';

/**
 * Share of the screen the sheet may take. The rest stays for the header and
 * the live map — without a cap, the driver card, OTPs and rating squeezed the
 * map down to a sliver.
 */
const MAX_SHEET_HEIGHT = '55%';

export interface TrackingSheetProps {
  /** Status, OTP, driver and timeline — scrolls when it doesn't fit. */
  children: ReactNode;
  /** Actions pinned below the scrolling content. */
  footer?: ReactNode;
}

/** Bottom sheet of the sender and receiver tracking screens. */
export function TrackingSheet({ children, footer }: TrackingSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <AnimatedView
      entering={SlideInDown.duration(DURATION.sheet).easing(SHEET_EASE)}
      style={{
        maxHeight: MAX_SHEET_HEIGHT,
        paddingBottom: insets.bottom + 16,
        zIndex: 10,
        elevation: 10,
      }}
      className="rounded-t-3xl bg-surface pt-5"
    >
      <AppScrollView
        className="flex-none"
        style={{ flexShrink: 1 }}
        contentContainerClassName="px-5"
      >
        {children}
      </AppScrollView>
      {footer ? <AppView className="px-5">{footer}</AppView> : null}
    </AnimatedView>
  );
}
