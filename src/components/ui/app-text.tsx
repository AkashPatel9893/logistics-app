import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextVariant =
  'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'caption' | 'muted' | 'code';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  display: 'text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight',
  title: 'text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight',
  heading: 'text-xl font-bold text-neutral-900 dark:text-neutral-100',
  subtitle: 'text-base font-semibold text-neutral-800 dark:text-neutral-200',
  body: 'text-base font-normal text-neutral-900 dark:text-neutral-100',
  caption: 'text-sm font-medium text-neutral-600 dark:text-neutral-400',
  muted: 'text-sm font-normal text-neutral-500 dark:text-neutral-400',
  code: 'font-mono text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-1 rounded',
};

export const AppText = React.forwardRef<RNText, AppTextProps>(
  ({ variant = 'body', className, style, children, ...props }, ref) => {
    return (
      <RNText ref={ref} className={cn(variantStyles[variant], className)} style={style} {...props}>
        {children}
      </RNText>
    );
  },
);

AppText.displayName = 'AppText';

export const Text = AppText;
