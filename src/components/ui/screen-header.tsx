import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { AppText } from './app-text';
import { AppView } from './app-view';
import { LiquidGlassBackButton } from './liquid-glass-back-button';

export interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  floating?: boolean;
  className?: string;
}

export function ScreenHeader({
  title,
  onBack,
  right,
  floating = false,
  className,
}: ScreenHeaderProps) {
  return (
    <AppView
      pointerEvents={floating ? 'box-none' : 'auto'}
      className={cn(
        'flex-row items-center px-4 pt-safe-offset-2',
        floating ? 'absolute inset-x-0 top-0 z-10 justify-between' : 'pb-4',
        className,
      )}
    >
      {onBack ? <LiquidGlassBackButton onPress={onBack} size={44} controlSize="large" /> : null}
      {title ? (
        <AppText
          accessibilityRole="header"
          numberOfLines={1}
          className="ml-3 flex-1 text-[19px] font-bold tracking-tight text-foreground"
        >
          {title}
        </AppText>
      ) : null}
      {right}
    </AppView>
  );
}
