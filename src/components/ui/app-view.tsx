import type { ComponentPropsWithRef } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppViewProps extends ComponentPropsWithRef<typeof View> {
  className?: string;
  /** Shorthand for `flex-row items-center`. */
  row?: boolean;
  /** Shorthand for `items-center justify-center`. */
  center?: boolean;
}

export function AppView({ className, row, center, ...props }: AppViewProps) {
  return (
    <View
      className={cn(
        row && 'flex-row items-center',
        center && 'items-center justify-center',
        className,
      )}
      {...props}
    />
  );
}
