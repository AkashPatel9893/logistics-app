import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
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
  const [cursorVisible, setCursorVisible] = useState(true);

  // Ensure keyboard focuses reliably after screen slide-in transition
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 550);
    return () => clearInterval(interval);
  }, [isFocused]);

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numericText);
    if (numericText.length === length) {
      onComplete?.(numericText);
    }
  };

  return (
    <AppPressable
      onPress={handleBoxPress}
      className="items-center justify-center my-4 relative"
      accessibilityRole="none"
    >
      {/* Visual OTP Boxes - pointerEvents="none" lets touches hit the full overlay input */}
      <AppView className="flex-row items-center justify-center gap-3.5" pointerEvents="none">
        {Array.from({ length }).map((_, index) => {
          const char = value[index];
          const isCurrentActive =
            isFocused && index === (value.length === length ? length - 1 : value.length);
          const hasChar = Boolean(char);

          return (
            <AppView
              key={index}
              className={cn(
                'w-[66px] h-[68px] rounded-[20px] bg-white dark:bg-neutral-900 items-center justify-center border',
                isCurrentActive
                  ? 'border-2 border-[#FF5A1F]'
                  : 'border-neutral-200 dark:border-neutral-800',
              )}
            >
              {hasChar ? (
                <AppText className="text-[28px] font-bold text-neutral-900 dark:text-white">
                  {char}
                </AppText>
              ) : isCurrentActive ? (
                cursorVisible ? (
                  <AppView className="w-[2px] h-7 bg-[#FF5A1F] rounded-full" />
                ) : (
                  <AppView className="w-[2px] h-7" />
                )
              ) : (
                <AppView className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              )}
            </AppView>
          );
        })}
      </AppView>

      {/* Hidden Full-Touch Native TextInput covering the entire boxes area */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.015,
            color: 'transparent',
            backgroundColor: 'transparent',
          },
        ]}
        caretHidden
        accessible={true}
        accessibilityLabel="OTP input"
      />
    </AppPressable>
  );
}
