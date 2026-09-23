import { cn } from '@/lib/cn';

import { AppView } from './app-view';

export interface DividerProps {
  /** Left inset, e.g. to align with text after a leading icon. */
  insetClassName?: string;
  className?: string;
}

export function Divider({ insetClassName, className }: DividerProps) {
  return <AppView className={cn('h-px bg-divider', insetClassName, className)} />;
}
