import React, { useState } from 'react';
import { GestureResponderEvent, Pressable as RNPressable, PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface AppPressableProps extends Omit<PressableProps, 'className'> {
  className?: string;
  pressedClassName?: string;
  scaleOnPress?: boolean;
}

export const AppPressable = React.forwardRef<
  React.ComponentRef<typeof RNPressable>,
  AppPressableProps
>(
  (
    {
      className,
      pressedClassName = 'opacity-70',
      scaleOnPress = false,
      disabled,
      children,
      onPressIn,
      onPressOut,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = (e: GestureResponderEvent) => {
      setIsPressed(true);
      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      setIsPressed(false);
      onPressOut?.(e);
    };

    return (
      <RNPressable
        ref={ref}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        className={cn(
          className,
          isPressed && !disabled && pressedClassName,
          isPressed && scaleOnPress && !disabled && 'scale-95',
          disabled && 'opacity-40',
        )}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </RNPressable>
    );
  },
);

AppPressable.displayName = 'AppPressable';

export const Pressable = AppPressable;
