import React from 'react';
import { View as RNView, ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppViewProps extends ViewProps {
  className?: string;
  row?: boolean;
  center?: boolean;
}

export const AppView = React.forwardRef<RNView, AppViewProps>(
  ({ className, row, center, style, children, ...props }, ref) => {
    return (
      <RNView
        ref={ref}
        className={cn(
          row && 'flex-row items-center',
          center && 'items-center justify-center',
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </RNView>
    );
  },
);

AppView.displayName = 'AppView';

export const View = AppView;
