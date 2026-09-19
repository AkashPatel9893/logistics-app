import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppScrollViewProps extends ScrollViewProps {
  className?: string;
  contentContainerClassName?: string;
}

export const AppScrollView = React.forwardRef<ScrollView, AppScrollViewProps>(
  (
    {
      className,
      contentContainerClassName,
      showsVerticalScrollIndicator = false,
      keyboardShouldPersistTaps = 'handled',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <ScrollView
        ref={ref}
        className={cn('flex-1', className)}
        contentContainerClassName={cn('grow', contentContainerClassName)}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);

AppScrollView.displayName = 'AppScrollView';
