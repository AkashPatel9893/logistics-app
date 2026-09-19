import React from 'react';

import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  progress: number;
  className?: string;
  barClassName?: string;
  testID?: string;
}

export function ProgressBar({ progress, className, barClassName, testID }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <AppView
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      testID={testID}
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800',
        className,
      )}
    >
      <AppView
        className={cn('h-full bg-orange-500 rounded-full transition-all', barClassName)}
        style={{ width: `${clampedProgress}%` }}
      />
    </AppView>
  );
}
