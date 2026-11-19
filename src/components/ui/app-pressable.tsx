import { useState, type ComponentPropsWithRef } from 'react';
import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';
import { Animated, CSS_EASE_OUT, DURATION } from '@/lib/motion';
import type { GestureResponderEvent } from '@/lib/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppPressableProps extends Omit<
  ComponentPropsWithRef<typeof Pressable>,
  'className'
> {
  className?: string;
  pressedClassName?: string;
  pressScale?: number;
}

export function AppPressable({
  ref,
  className,
  pressedClassName,
  pressScale,
  disabled,
  accessibilityRole = 'button',
  accessibilityState,
  style,
  onPressIn,
  onPressOut,
  ...props
}: AppPressableProps) {
  const [isPressed, setIsPressed] = useState(false);
  const shared = {
    disabled,
    accessibilityRole,
    accessibilityState: { ...accessibilityState, disabled: Boolean(disabled) },
    className: cn(className, !disabled && pressedClassName, disabled && 'opacity-40'),
  };

  if (pressScale === undefined) {
    return (
      <Pressable
        ref={ref}
        {...shared}
        style={style}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...props}
      />
    );
  }

  return (
    <AnimatedPressable
      ref={ref as any}
      {...shared}
      {...props}
      onPressIn={(event: GestureResponderEvent) => {
        setIsPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        setIsPressed(false);
        onPressOut?.(event);
      }}
      style={[
        typeof style === 'function' ? undefined : style,
        {
          transform: [{ scale: isPressed && !disabled ? pressScale : 1 }],
          transitionProperty: 'transform',
          transitionDuration: DURATION.press,
          transitionTimingFunction: CSS_EASE_OUT,
        },
      ]}
    />
  );
}
