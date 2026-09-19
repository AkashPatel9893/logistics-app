import React from 'react';
import { ViewProps } from 'react-native';

import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'elevated' | 'orange' | 'muted' | 'outline';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs',
  elevated:
    'bg-white dark:bg-neutral-900 shadow-md border border-neutral-100 dark:border-neutral-800',
  orange: 'bg-orange-500 shadow-lg shadow-orange-500/25',
  muted: 'bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800',
  outline: 'bg-transparent border border-neutral-200 dark:border-neutral-800',
};

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <AppView className={cn('rounded-2xl p-4', variantStyles[variant], className)} {...props}>
      {children}
    </AppView>
  );
}
