import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { cn } from '@/lib/cn';

import { AppPressable } from './app-pressable';
import { AppText } from './app-text';
import { AppView } from './app-view';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
}

// Wait for the screen's slide-in transition before focusing, or the keyboard
// can fail to open on some devices.
const AUTO_FOCUS_DELAY_MS = 250;
const CURSOR_BLINK_MS = 550;

function useBlink(isActive: boolean): boolean {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setIsVisible((visible) => !visible), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, [isActive]);
  return isVisible;
}

interface OtpCellProps {
  char: string | undefined;
  isActive: boolean;
  isCursorVisible: boolean;
}

function OtpCell({ char, isActive, isCursorVisible }: OtpCellProps) {
  return (
    <AppView
      center
      className={cn(
        'h-[68px] w-[66px] rounded-[20px] border bg-surface',
        isActive ? 'border-2 border-brand' : 'border-border',
      )}
    >
      {char ? (
        <AppText className="text-[28px] font-bold">{char}</AppText>
      ) : isActive ? (
        <AppView className={cn('h-7 w-[2px] rounded-full', isCursorVisible && 'bg-brand')} />
      ) : (
        <AppView className="size-2 rounded-full bg-border-strong" />
      )}
    </AppView>
  );
}

export function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isCursorVisible = useBlink(isFocused);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), AUTO_FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
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
      <AppView row pointerEvents="none" className="justify-center gap-3.5">
        {Array.from({ length }, (_, index) => (
          <OtpCell
            key={index}
            char={value[index]}
            isActive={isFocused && index === activeIndex}
            isCursorVisible={isCursorVisible}
          />
        ))}
      </AppView>

      {/* Invisible input covering the cells so taps and paste/autofill land on it. */}
      <TextInput
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
