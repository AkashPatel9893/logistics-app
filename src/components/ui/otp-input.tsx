import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from '@/lib/motion';

import { AnimatedView } from './animated-view';
import { AppPressable } from './app-pressable';
import { AppText } from './app-text';
import { AppTextInput, type AppTextInputInstance } from './app-text-input';
import { AppView } from './app-view';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  /** Paints the cells red until the value changes. */
  hasError?: boolean;
  /** Bump this number to shake the row and play the error haptic (once per wrong code). */
  shakeKey?: number;
}

// Wait for the screen's slide-in transition before focusing, or the keyboard
// can fail to open on some devices.
const AUTO_FOCUS_DELAY_MS = 250;
const CURSOR_BLINK_MS = 550;
const SHAKE_DISTANCE = 12;
const CELL_HEIGHT = 64;

function useBlink(isActive: boolean): boolean {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setIsVisible((visible) => !visible), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, [isActive]);
  return isVisible;
}

/** Horizontal shake plus error haptic whenever `shakeKey` increases. */
function useShake(shakeKey: number) {
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (shakeKey === 0) return;
    haptics.error();
    if (reducedMotion) return;
    translateX.set(
      withSequence(
        withTiming(-SHAKE_DISTANCE, { duration: 45 }),
        withTiming(SHAKE_DISTANCE, { duration: 90 }),
        withTiming(-SHAKE_DISTANCE * 0.8, { duration: 90 }),
        withTiming(SHAKE_DISTANCE * 0.6, { duration: 80 }),
        withTiming(-SHAKE_DISTANCE * 0.3, { duration: 70 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [shakeKey, reducedMotion, translateX]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: translateX.get() }] }));
}

interface OtpCellProps {
  char: string | undefined;
  isActive: boolean;
  isCursorVisible: boolean;
  hasError: boolean;
}

function OtpCell({ char, isActive, isCursorVisible, hasError }: OtpCellProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const isFilled = char !== undefined;

  // The digit "pops" in: quick overshoot, then settles.
  useEffect(() => {
    if (!isFilled || reducedMotion) return;
    scale.set(withSequence(withTiming(1.1, { duration: 80 }), withSpring(1, { duration: 280 })));
  }, [isFilled, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedView
      center
      style={[{ height: CELL_HEIGHT }, animatedStyle]}
      className={cn(
        // Shrinks below 58px so a 6-digit code still fits the screen width.
        'max-w-[58px] flex-1 rounded-2xl border',
        hasError
          ? 'border-2 border-error bg-error/10'
          : isActive
            ? 'border-2 border-brand bg-surface'
            : 'border-border bg-surface shadow-sm shadow-black/5',
      )}
    >
      {isFilled ? (
        <AppText
          className={cn('text-[26px] font-bold', hasError ? 'text-error' : 'text-foreground')}
        >
          {char}
        </AppText>
      ) : isActive ? (
        <AppView className={cn('h-7 w-[2px] rounded-full', isCursorVisible && 'bg-brand')} />
      ) : (
        <AppView className="size-2 rounded-full bg-border-strong" />
      )}
    </AnimatedView>
  );
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  hasError = false,
  shakeKey = 0,
}: OtpInputProps) {
  const inputRef = useRef<AppTextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isCursorVisible = useBlink(isFocused);
  const shakeStyle = useShake(shakeKey);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), AUTO_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    if (digits.length > value.length) haptics.selection();
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  const activeIndex = value.length === length ? length - 1 : value.length;

  return (
    <AppPressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      className="relative my-4 items-center justify-center"
    >
      <AnimatedView
        row
        pointerEvents="none"
        style={shakeStyle}
        className="w-full justify-center gap-2.5"
      >
        {Array.from({ length }, (_, index) => (
          <OtpCell
            key={index}
            char={value[index]}
            isActive={isFocused && index === activeIndex}
            isCursorVisible={isCursorVisible}
            hasError={hasError}
          />
        ))}
      </AnimatedView>

      {/* Invisible input covering the cells so taps and paste/autofill land on it. */}
      <AppTextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden
        accessibilityLabel="OTP input"
        className="absolute inset-0 bg-transparent text-transparent opacity-[0.015]"
      />
    </AppPressable>
  );
}
