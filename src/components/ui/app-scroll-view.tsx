import type { ComponentPropsWithRef } from 'react';
import { ScrollView } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppScrollViewProps extends ComponentPropsWithRef<typeof ScrollView> {
  className?: string;
  contentContainerClassName?: string;
  flex?: boolean;
}

export function AppScrollView({
  ref,
  className,
  contentContainerClassName,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  horizontal,
  flex = !horizontal,
  ...props
}: AppScrollViewProps) {
  return (
    <ScrollView
      ref={ref}
      horizontal={horizontal}
      className={cn(flex && 'flex-1', className)}
      contentContainerClassName={cn(flex && 'grow', contentContainerClassName)}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
}
