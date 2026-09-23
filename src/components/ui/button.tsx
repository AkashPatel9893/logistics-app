import type { ReactNode } from 'react';

import type { ThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

import { AppPressable, type AppPressableProps } from './app-pressable';
import { AppSpinner } from './app-spinner';
import { AppText } from './app-text';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends Omit<AppPressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  textClassName?: string;
}

const VARIANTS: Record<ButtonVariant, { container: string; text: string; spinner: ThemeColor }> = {
  primary: {
    container: 'bg-inverse border border-inverse',
    text: 'text-inverse-foreground font-semibold',
    spinner: 'inverse-foreground',
  },
  // Orange pill call-to-action (confirm location, save address, top up).
  brand: {
    container: 'bg-brand rounded-full',
    text: 'text-brand-foreground font-bold',
    spinner: 'brand-foreground',
  },
  secondary: {
    container: 'bg-surface-muted border border-border',
    text: 'text-foreground font-semibold',
    spinner: 'foreground',
  },
  outline: {
    container: 'bg-transparent border border-border-strong',
    text: 'text-foreground font-semibold',
    spinner: 'foreground',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-foreground-tertiary font-medium',
    spinner: 'foreground',
  },
  destructive: {
    container: 'bg-danger border border-danger',
    text: 'text-brand-foreground font-semibold',
    spinner: 'brand-foreground',
  },
};

const SIZES: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'h-10 px-4 rounded-xl', text: 'text-sm' },
  md: { container: 'h-12 px-5 rounded-2xl', text: 'text-base' },
  lg: { container: 'h-14 px-6 rounded-2xl', text: 'text-base' },
  icon: { container: 'h-11 w-11 rounded-2xl items-center justify-center', text: 'text-base' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const styles = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <AppPressable
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      pressScale={0.97}
      accessibilityState={{ busy: loading }}
      className={cn(
        'flex-row items-center justify-center gap-2',
        SIZES[size].container,
        styles.container,
        className,
      )}
      {...props}
    >
      {loading ? (
        <AppSpinner tone={styles.spinner} />
      ) : (
        <>
          {leftIcon}
          <AppText className={cn('text-center', SIZES[size].text, styles.text, textClassName)}>
            {label}
          </AppText>
          {rightIcon}
        </>
      )}
    </AppPressable>
  );
}
