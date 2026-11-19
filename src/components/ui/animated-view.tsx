import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';
import { Animated } from '@/lib/motion';

export interface AnimatedViewProps extends ComponentPropsWithRef<typeof Animated.View> {
  className?: string;
  row?: boolean;
  center?: boolean;
}

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
