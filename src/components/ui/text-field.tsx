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
  /** Draws the field in the brand colour to say "fill this in" (e.g. a required note). */
  highlighted?: boolean;
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
    // py-0: Android adds vertical padding to inputs by default, which shifts the text.
    input: 'flex-1 py-0 text-[15px] font-semibold text-foreground',
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
  highlighted = false,
  leading,
  className,
  inputClassName,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const placeholderColor = useThemeColor('icon-subtle');
  const styles = VARIANTS[variant];
  // `editable={false}` shows as a locked, greyed-out field instead of a normal input.
  const isLocked = inputProps.editable === false;

  return (
    <AppView className={className}>
      {label ? (
        <AppText className={styles.label}>
          {label}
          {required ? <AppText className="text-brand"> *</AppText> : null}
        </AppText>
      ) : null}

      <AppView
        className={cn(
          styles.field,
          error ? 'border-error' : highlighted ? 'border-brand' : styles.idleBorder,
          isLocked && 'bg-surface-muted',
        )}
      >
        {leading}
        <TextInput
          placeholderTextColor={placeholderColor}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          className={cn(styles.input, inputClassName, isLocked && 'text-muted')}
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
