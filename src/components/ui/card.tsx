import { cn } from '@/lib/cn';

import { AppView, type AppViewProps } from './app-view';

export type CardVariant = 'default' | 'elevated' | 'brand' | 'muted' | 'outline';

export interface CardProps extends AppViewProps {
  variant?: CardVariant;
}

const VARIANTS: Record<CardVariant, string> = {
  default: 'bg-surface border border-border shadow-xs',
  elevated: 'bg-surface border border-divider shadow-md',
  brand: 'bg-brand shadow-lg shadow-brand/25',
  muted: 'bg-surface-muted border border-border',
  outline: 'bg-transparent border border-border',
};

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return <AppView className={cn('rounded-2xl p-4', VARIANTS[variant], className)} {...props} />;
}
