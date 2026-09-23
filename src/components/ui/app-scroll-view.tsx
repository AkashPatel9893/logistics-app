import type { ComponentPropsWithRef } from 'react';
import { ScrollView } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppScrollViewProps extends ComponentPropsWithRef<typeof ScrollView> {
  className?: string;
  contentContainerClassName?: string;
}

export function AppScrollView({
  className,
  contentContainerClassName,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  horizontal,
  ...props
}: AppScrollViewProps) {
  return (
    <ScrollView
      horizontal={horizontal}
      className={cn(!horizontal && 'flex-1', className)}
      contentContainerClassName={cn(!horizontal && 'grow', contentContainerClassName)}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
}
