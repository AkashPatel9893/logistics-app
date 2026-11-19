import type { ComponentPropsWithRef } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppViewProps extends ComponentPropsWithRef<typeof View> {
  className?: string;
  row?: boolean;
  center?: boolean;
}

export function AppView({ ref, className, row, center, ...props }: AppViewProps) {
  return (
    <View
      ref={ref}
      className={cn(
        row && 'flex-row items-center',
        center && 'items-center justify-center',
        className,
      )}
      {...props}
    />
  );
}
