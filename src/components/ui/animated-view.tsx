import type { ComponentPropsWithRef } from 'react';
import Animated from 'react-native-reanimated';

import { cn } from '@/lib/cn';

export interface AnimatedViewProps extends ComponentPropsWithRef<typeof Animated.View> {
  className?: string;
  /** Shorthand for `flex-row items-center`. */
  row?: boolean;
  /** Shorthand for `items-center justify-center`. */
  center?: boolean;
}

/**
 * Reanimated view that keeps Uniwind `className` support — use it for
 * `entering` / `exiting` / `layout` animations and animated styles.
 *
 * Defaults to `collapsable={false}` to prevent React Native Fabric view flattening
 * from dropping or reindexing native subviews during layout animations.
 */
export function AnimatedView({
  ref,
  className,
  row,
  center,
  collapsable = false,
  ...props
}: AnimatedViewProps) {
  return (
    <Animated.View
      ref={ref as any}
      collapsable={collapsable}
      className={cn(
        row && 'flex-row items-center',
        center && 'items-center justify-center',
        className,
      )}
      {...props}
    />
  );
}
