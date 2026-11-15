import type { ComponentPropsWithRef } from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { cn } from '@/lib/cn';

export interface AppKeyboardAvoidingViewProps extends ComponentPropsWithRef<
  typeof KeyboardAvoidingView
> {
  className?: string;
}

export function AppKeyboardAvoidingView({
  className,
  // keyboard-controller drives the padding frame-by-frame with the system keyboard animation, on
  // both platforms (the app is edge-to-edge, so the OS does not resize the window).
  behavior = 'padding',
  ...props
}: AppKeyboardAvoidingViewProps) {
  return (
    <KeyboardAvoidingView behavior={behavior} className={cn('flex-1', className)} {...props} />
  );
}
