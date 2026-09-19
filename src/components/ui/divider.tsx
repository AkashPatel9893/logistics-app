import React from 'react';

import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface DividerProps {
  label?: string;
  text?: string;
  className?: string;
  lineClassName?: string;
}

export function Divider({ label, text, className, lineClassName }: DividerProps) {
  const displayLabel = label ?? text;
  if (!displayLabel) {
    return (
      <AppView
        className={cn(
          'h-px bg-neutral-200 dark:bg-neutral-800 w-full my-2',
          lineClassName,
          className,
        )}
      />
    );
  }

  return (
    <AppView className={cn('flex-row items-center w-full my-3', className)}>
      <AppView className={cn('flex-1 h-px bg-neutral-200 dark:bg-neutral-800', lineClassName)} />
      <AppText className="px-3 text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">
        {displayLabel}
      </AppText>
      <AppView className={cn('flex-1 h-px bg-neutral-200 dark:bg-neutral-800', lineClassName)} />
    </AppView>
  );
}
