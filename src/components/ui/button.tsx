import { PressableProps } from 'react-native';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppSpinner } from '@/components/ui/app-spinner';
import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'className'> {
  title?: string;
  label?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-neutral-900 dark:bg-white border border-neutral-900 dark:border-white',
    text: 'text-white dark:text-neutral-950 font-semibold',
  },
  secondary: {
    container:
      'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    text: 'text-neutral-900 dark:text-neutral-100 font-semibold',
  },
  outline: {
    container: 'bg-transparent border border-neutral-300 dark:border-neutral-700',
    text: 'text-neutral-900 dark:text-neutral-100 font-semibold',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-neutral-600 dark:text-neutral-400 font-medium',
  },
  destructive: {
    container: 'bg-red-600 border border-red-600',
    text: 'text-white font-semibold',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'h-10 px-4 rounded-xl',
    text: 'text-sm',
  },
  md: {
    container: 'h-12 px-5 rounded-2xl',
    text: 'text-base',
  },
  default: {
    container: 'h-12 px-5 rounded-2xl',
    text: 'text-base',
  },
  lg: {
    container: 'h-14 px-6 rounded-2xl',
    text: 'text-base',
  },
  icon: {
    container: 'h-11 w-11 rounded-2xl items-center justify-center',
    text: 'text-base',
  },
};

export function Button({
  title,
  label,
  children,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  loading = false,
  disabled = false,
  className,
  textClassName,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const displayTitle = label ?? title;
  const isButtonLoading = loading || isLoading;
  const isDisabled = disabled || isButtonLoading;
  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size] ?? sizeStyles.lg;

  return (
    <AppPressable
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2',
        currentSize.container,
        currentVariant.container,
        isDisabled && 'opacity-60',
        className,
      )}
      {...props}
    >
      {isButtonLoading ? (
        <AppSpinner size="sm" variant={variant === 'primary' ? 'white' : 'primary'} />
      ) : (
        <>
          {leftIcon}
          {displayTitle ? (
            <AppText
              className={cn('text-center', currentSize.text, currentVariant.text, textClassName)}
            >
              {displayTitle}
            </AppText>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </AppPressable>
  );
}
