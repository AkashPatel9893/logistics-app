import { useState, type ComponentPropsWithRef } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { CSS_EASE_OUT, DURATION } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppPressableProps extends Omit<
  ComponentPropsWithRef<typeof Pressable>,
  'className'
> {
  className?: string;
  /** Classes applied while pressed, via Uniwind's `active:` variant. */
  pressedClassName?: string;
  /**
   * Scale to shrink to while pressed (e.g. 0.97) for button-like controls.
   * Animated with a short ease-out transition; leave unset for full-width rows.
   */
  pressScale?: number;
}

/** Pressable with press feedback (opacity, optional scale) and disabled styling. */
export function AppPressable({
  className,
  pressedClassName = 'active:opacity-70',
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
