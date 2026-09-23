import type { ComponentPropsWithRef, ReactNode } from 'react';
import { TextInput } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

import { AppText } from './app-text';
import { AppView } from './app-view';

export type TextFieldVariant = 'outlined' | 'filled';

export interface TextFieldProps extends Omit<ComponentPropsWithRef<typeof TextInput>, 'className'> {
  /**
   * `outlined`: tall white bordered field (login, onboarding).
   * `filled`: compact grey field (address details, wallet).
   */
  variant?: TextFieldVariant;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Element rendered before the input (icon, country code). */
  leading?: ReactNode;
  className?: string;
  inputClassName?: string;
}

const VARIANTS = {
  outlined: {
    label: 'mb-1.5 text-[13px] font-bold text-foreground-emphasis',
    field: 'h-14 flex-row items-center rounded-2xl border bg-surface px-4',
    idleBorder: 'border-border',
    input: 'flex-1 text-[15px] font-semibold text-foreground',
    error: 'mt-1 ml-1 text-xs font-medium text-error',
  },
  filled: {
    label: 'mb-1.5 text-[12px] font-semibold text-muted',
    field: 'rounded-xl border bg-surface-muted',
    idleBorder: 'border-transparent',
    input: 'px-4 py-3 text-[14px] font-medium text-foreground',
    error: 'mt-1 text-[11px] font-medium text-error',
  },
} as const;

/** Labeled text input with error/hint text; the app's single input control. */
export function TextField({
  variant = 'filled',
  label,
  required = false,
  error,
  hint,
  leading,
  className,
  inputClassName,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const placeholderColor = useThemeColor('icon-subtle');
  const styles = VARIANTS[variant];

  return (
    <AppView className={className}>
      {label ? (
        <AppText className={styles.label}>
          {label}
          {required ? <AppText className="text-brand"> *</AppText> : null}
        </AppText>
      ) : null}

      <AppView className={cn(styles.field, error ? 'border-error' : styles.idleBorder)}>
        {leading}
        <TextInput
          placeholderTextColor={placeholderColor}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          className={cn(styles.input, inputClassName)}
          {...inputProps}
        />
      </AppView>

      {error ? (
        <AppText className={styles.error}>{error}</AppText>
      ) : hint ? (
        <AppText className="mt-1 ml-1 text-[11px] text-subtle">{hint}</AppText>
      ) : null}
    </AppView>
  );
}
