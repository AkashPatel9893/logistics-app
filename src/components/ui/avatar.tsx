import { cn } from '@/lib/cn';

import { AppImage } from './app-image';
import { AppText } from './app-text';
import { AppView } from './app-view';

export interface AvatarProps {
  name?: string;
  source?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: { box: 'size-8', text: 'text-xs' },
  md: { box: 'size-10', text: 'text-sm' },
  lg: { box: 'size-14', text: 'text-base' },
  xl: { box: 'size-20', text: 'text-xl' },
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name = '', source, size = 'md', className }: AvatarProps) {
  const sizeClasses = SIZES[size];

  if (source) {
    return (
      <AppView
        className={cn(
          'overflow-hidden rounded-full border border-divider bg-border',
          sizeClasses.box,
          className,
        )}
      >
        <AppImage source={source} className="size-full" contentFit="cover" />
      </AppView>
    );
  }

  return (
    <AppView
      center
      accessibilityLabel={name || undefined}
      className={cn(
        'rounded-full border border-avatar-border bg-avatar',
        sizeClasses.box,
        className,
      )}
    >
      <AppText className={cn('font-bold text-avatar-foreground', sizeClasses.text)}>
        {getInitials(name) || '?'}
      </AppText>
    </AppView>
  );
}
