import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isError?: boolean;
  containerClassName?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      isError = false,
      containerClassName,
      wrapperClassName,
      inputClassName,
      leftSlot,
      rightSlot,
      prefix,
      suffix,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const effectiveLeftSlot = leftSlot ?? prefix;
    const effectiveRightSlot = rightSlot ?? suffix;
    const [isFocused, setIsFocused] = useState(false);
    const hasError = isError || Boolean(error);

    const inputElement = (
      <AppView
        className={cn(
          'flex-row items-center h-14 bg-white dark:bg-neutral-900 rounded-2xl px-4 border-[1.5px] border-neutral-200 dark:border-neutral-800',
          isFocused && 'border-neutral-900 dark:border-neutral-100',
          hasError && 'border-red-500 dark:border-red-500',
          containerClassName,
        )}
      >
        {effectiveLeftSlot}
        <TextInput
          ref={ref}
          placeholderTextColor="#9CA3AF"
          className={cn(
            'flex-1 h-full text-base font-medium text-neutral-900 dark:text-neutral-100 p-0',
            inputClassName,
          )}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {effectiveRightSlot}
      </AppView>
    );

    if (label || error) {
      return (
        <AppView className={cn('w-full', wrapperClassName)}>
          {label && (
            <AppText className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {label}
            </AppText>
          )}
          {inputElement}
          {error && <AppText className="text-xs font-medium text-red-500 mt-1">{error}</AppText>}
        </AppView>
      );
    }

    return inputElement;
  },
);

Input.displayName = 'Input';
