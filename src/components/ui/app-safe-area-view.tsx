import React from 'react';
import { SafeAreaView, NativeSafeAreaViewProps } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export interface AppSafeAreaViewProps extends NativeSafeAreaViewProps {
  className?: string;
}

export const AppSafeAreaView = React.forwardRef<
  React.ComponentRef<typeof SafeAreaView>,
  AppSafeAreaViewProps
>(({ className, style, edges = [], children, ...props }, ref) => {
  return (
    <SafeAreaView
      ref={ref}
      edges={edges}
      style={[{ flex: 1 }, style]}
      className={cn('flex-1 bg-neutral-50', className)}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
});

AppSafeAreaView.displayName = 'AppSafeAreaView';
