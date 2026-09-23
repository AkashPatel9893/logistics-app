import { useUniwind } from 'uniwind';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppView } from '@/components/ui/app-view';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

export interface LiquidGlassBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
  controlSize?: 'mini' | 'small' | 'regular' | 'large' | 'extraLarge';
  className?: string;
}

const CONTROL_SIZE_ICON_SIZE: Record<
  NonNullable<LiquidGlassBackButtonProps['controlSize']>,
  number
> = {
  mini: 14,
  small: 16,
  regular: 18,
  large: 22,
  extraLarge: 26,
};

/**
 * Android/default back button. `.ios.tsx` provides the SwiftUI Liquid Glass
 * version — Metro resolves the right file per platform, so `@expo/ui/swift-ui`
 * is never bundled for Android.
 */
export function LiquidGlassBackButton({
  onPress,
  accessibilityLabel = 'Back',
  size = 54,
  controlSize: controlSizeProp = 'extraLarge',
  className,
}: LiquidGlassBackButtonProps) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const tintColor = isDark ? '#F4F4F5' : '#18181B';

  return (
    <AppPressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      pressedClassName="opacity-80"
      className={cn('items-center justify-center rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
    >
      <AppView
        pointerEvents="none"
        className={cn(
          'absolute inset-0 rounded-full border',
          isDark ? 'bg-neutral-800/70 border-white/10' : 'bg-white/70 border-black/5',
        )}
      />
      <Icon name="chevron.left" size={CONTROL_SIZE_ICON_SIZE[controlSizeProp]} color={tintColor} />
    </AppPressable>
  );
}
