import React from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppKeyboardAvoidingViewProps extends KeyboardAvoidingViewProps {
  className?: string;
}

export const AppKeyboardAvoidingView = React.forwardRef<
  KeyboardAvoidingView,
  AppKeyboardAvoidingViewProps
>(({ className, style, behavior, children, ...props }, ref) => {
  const defaultBehavior = behavior ?? (Platform.OS === 'ios' ? 'padding' : undefined);

  return (
    <KeyboardAvoidingView
      ref={ref}
      behavior={defaultBehavior}
      style={[{ flex: 1 }, style]}
      className={cn('flex-1', className)}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
});

AppKeyboardAvoidingView.displayName = 'AppKeyboardAvoidingView';
