import type { ThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

import { AppView } from './app-view';
import { Icon, type IconName } from './icon';

export interface IconBadgeProps {
  name: IconName;
  /** Icon color token. */
  tone?: ThemeColor;
  iconSize?: number;
  /** Size, shape and background classes, e.g. `size-10 rounded-full bg-surface-muted`. */
  className?: string;
}

/** An icon centered inside a tinted circle or rounded square. */
export function IconBadge({ name, tone = 'icon', iconSize = 18, className }: IconBadgeProps) {
  return (
    <AppView center className={cn('size-10 rounded-full bg-surface-muted', className)}>
      <Icon name={name} size={iconSize} tone={tone} />
    </AppView>
  );
}
