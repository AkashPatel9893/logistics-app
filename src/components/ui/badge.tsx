import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'accent' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  accent: {
    container: 'bg-orange-100 border border-orange-200',
    text: 'text-orange-700 font-semibold',
  },
  success: {
    container: 'bg-emerald-100 border border-emerald-200',
    text: 'text-emerald-700 font-semibold',
  },
  warning: {
    container: 'bg-amber-100 border border-amber-200',
    text: 'text-amber-800 font-semibold',
  },
  error: {
    container: 'bg-red-100 border border-red-200',
    text: 'text-red-700 font-semibold',
  },
  neutral: {
    container: 'bg-neutral-100 border border-neutral-200',
    text: 'text-neutral-700 font-medium',
  },
  outline: {
    container: 'bg-transparent border border-neutral-300',
    text: 'text-neutral-700 font-medium',
  },
};

export function Badge({ label, variant = 'neutral', className, textClassName, icon }: BadgeProps) {
  const current = variantStyles[variant];

  return (
    <View
      className={cn(
        'flex-row items-center self-start px-2.5 py-1 rounded-full gap-1.5',
        current.container,
        className,
      )}
    >
      {icon}
      <AppText className={cn('text-xs', current.text, textClassName)}>{label}</AppText>
    </View>
  );
}
