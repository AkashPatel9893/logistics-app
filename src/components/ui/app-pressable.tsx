import { type ComponentPropsWithRef } from 'react';
import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';
import {
  Animated,
  DURATION,
  ENTER_EASE_OUT,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from '@/lib/motion';
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

interface ScaledPressableProps extends Omit<AppPressableProps, 'pressScale' | 'className'> {
  pressScale: number;
  computedClassName: string;
}

function ScaledPressable({
  ref,
  pressScale,
  computedClassName,
  disabled,
  accessibilityRole = 'button',
  accessibilityState,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ScaledPressableProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      ref={ref as any}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className={computedClassName}
      {...props}
      onPressIn={(event: GestureResponderEvent) => {
        if (!disabled && !reducedMotion) {
          scale.set(withTiming(pressScale, { duration: DURATION.press, easing: ENTER_EASE_OUT }));
        }
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        if (!reducedMotion) {
          scale.set(withTiming(1, { duration: DURATION.press, easing: ENTER_EASE_OUT }));
        }
        onPressOut?.(event);
      }}
      style={[typeof style === 'function' ? undefined : style, animatedStyle]}
    />
  );
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
  const computedClassName = cn(className, !disabled && pressedClassName, disabled && 'opacity-40');
  const sharedState = { ...accessibilityState, disabled: Boolean(disabled) };

  if (pressScale === undefined) {
    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityState={sharedState}
        className={computedClassName}
        style={style}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...props}
      />
    );
  }

  return (
    <ScaledPressable
      ref={ref}
      pressScale={pressScale}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={sharedState}
      computedClassName={computedClassName}
      style={style}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}
    />
  );
}
