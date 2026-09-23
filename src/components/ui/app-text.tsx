import type { ComponentPropsWithRef } from 'react';
import { Text } from 'react-native';

import { cn } from '@/lib/cn';

export type TextVariant =
  'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'caption' | 'muted' | 'code';

export interface AppTextProps extends ComponentPropsWithRef<typeof Text> {
  variant?: TextVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<TextVariant, string> = {
  display: 'text-3xl font-black tracking-tight text-foreground',
  title: 'text-2xl font-extrabold tracking-tight text-foreground',
  heading: 'text-xl font-bold text-foreground',
  subtitle: 'text-base font-semibold text-foreground-emphasis',
  body: 'text-base font-normal text-foreground',
  caption: 'text-sm font-medium text-foreground-tertiary',
  muted: 'text-sm font-normal text-muted',
  code: 'rounded bg-surface-muted p-1 font-mono text-xs text-foreground-secondary',
};

export function AppText({ variant = 'body', className, ...props }: AppTextProps) {
  return <Text className={cn(VARIANT_CLASSES[variant], className)} {...props} />;
}
