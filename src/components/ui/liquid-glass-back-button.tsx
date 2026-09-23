import { useUniwind } from 'uniwind';

import { cn } from '@/lib/cn';

import { AppPressable } from './app-pressable';
import { AppView } from './app-view';
import { Icon } from './icon';
import type {
  BackButtonControlSize,
  LiquidGlassBackButtonProps,
} from './liquid-glass-back-button.types';

export type { LiquidGlassBackButtonProps };

const ICON_SIZE: Record<BackButtonControlSize, number> = {
  mini: 14,
  small: 16,
  regular: 18,
  large: 22,
  extraLarge: 26,
};

// Glass-style tint/ripple, matching the iOS Liquid Glass button.
const TINT = { dark: '#F4F4F5', light: '#18181B' } as const;
const RIPPLE = { dark: 'rgba(255,255,255,0.15)', light: 'rgba(0,0,0,0.08)' } as const;

/**
 * Android/default back button. `.ios.tsx` provides the SwiftUI Liquid Glass
 * version; Metro picks the right file per platform.
 */
export function LiquidGlassBackButton({
  onPress,
  accessibilityLabel = 'Back',
  size = 54,
  controlSize = 'extraLarge',
}: LiquidGlassBackButtonProps) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';

  return (
    <AppPressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      pressedClassName="active:opacity-80"
      className="items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      android_ripple={{ color: isDark ? RIPPLE.dark : RIPPLE.light, radius: size / 2 }}
    >
      <AppView
        pointerEvents="none"
        className={cn(
          'absolute inset-0 rounded-full border',
          isDark ? 'border-white/10 bg-neutral-800/70' : 'border-black/5 bg-white/70',
        )}
      />
      <Icon
        name="chevron.left"
        size={ICON_SIZE[controlSize]}
        color={isDark ? TINT.dark : TINT.light}
      />
    </AppPressable>
  );
}
