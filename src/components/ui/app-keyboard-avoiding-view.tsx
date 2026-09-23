import type { ComponentPropsWithRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppKeyboardAvoidingViewProps extends ComponentPropsWithRef<
  typeof KeyboardAvoidingView
> {
  className?: string;
}

export function AppKeyboardAvoidingView({
  className,
  // 'padding' on Android too: the app is edge-to-edge, so the OS no longer
  // resizes the window for the keyboard (adjustResize has no effect) and inputs
  // would otherwise sit behind it.
  behavior = 'padding',
  ...props
}: AppKeyboardAvoidingViewProps) {
  return (
    <KeyboardAvoidingView behavior={behavior} className={cn('flex-1', className)} {...props} />
  );
}
