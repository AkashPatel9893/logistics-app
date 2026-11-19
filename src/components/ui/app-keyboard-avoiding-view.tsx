import type { ComponentPropsWithRef, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardProvider,
} from 'react-native-keyboard-controller';
import { withUniwind } from 'uniwind';

import { cn } from '@/lib/cn';

const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledKeyboardAwareScrollView = withUniwind(KeyboardAwareScrollView);

export function AppKeyboardProvider({ children }: { children: ReactNode }) {
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

export interface AppKeyboardAvoidingViewProps extends ComponentPropsWithRef<
  typeof StyledKeyboardAvoidingView
> {
  className?: string;
  flex?: boolean;
}

export function AppKeyboardAvoidingView({
  className,
  flex = true,
  // keyboard-controller drives the padding frame-by-frame with the system keyboard animation, on
  // both platforms (the app is edge-to-edge, so the OS does not resize the window).
  behavior = 'padding',
  ...props
}: AppKeyboardAvoidingViewProps) {
  return (
    <StyledKeyboardAvoidingView
      behavior={behavior}
      className={cn(flex && 'flex-1', className)}
      {...props}
    />
  );
}

export interface AppKeyboardAwareScrollViewProps extends ComponentPropsWithRef<
  typeof StyledKeyboardAwareScrollView
> {
  className?: string;
  contentContainerClassName?: string;
}

export function AppKeyboardAwareScrollView({
  className,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...props
}: AppKeyboardAwareScrollViewProps) {
  return (
    <StyledKeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      className={cn('flex-1', className)}
      {...props}
    />
  );
}
