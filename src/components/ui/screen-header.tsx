import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

import { AppText } from './app-text';
import { AppView } from './app-view';
import { LiquidGlassBackButton } from './liquid-glass-back-button';

export interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  /** Optional trailing element (action button, badge). */
  right?: ReactNode;
  /** Float over content (maps) instead of taking layout space. */
  floating?: boolean;
  className?: string;
}

/** Safe-area-aware header with a back button, title and optional trailing action. */
export function ScreenHeader({
  title,
  onBack,
  right,
  floating = false,
  className,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppView
      style={{ paddingTop: insets.top + 8 }}
      pointerEvents={floating ? 'box-none' : 'auto'}
      className={cn(
        'flex-row items-center px-4',
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
