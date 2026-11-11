import { useEffect, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { cn } from '@/lib/cn';

import { AppView } from './app-view';

const SWEEP_MS = 1300;
/** Strips of rising then falling opacity: a soft highlight without a gradient library. */
const STRIP_OPACITIES = [0.05, 0.12, 0.2, 0.26, 0.2, 0.12, 0.05];
const STRIP_WIDTH = 14;
const BAND_WIDTH = STRIP_OPACITIES.length * STRIP_WIDTH;

export interface SkeletonProps {
  /** Size and shape, e.g. `h-4 w-32 rounded-md`. */
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A placeholder block with a light sweeping across it, shown where content is loading. Shape it
 * like the content it stands in for. Holds still when Reduce Motion is on.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  // The same white band glares on a dark placeholder; dim it there.
  const { theme } = useUniwind();
  const bandStrength = theme === 'dark' ? 0.45 : 1;
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || width === 0) return;
    progress.set(0);
    progress.set(
      withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) }), -1),
    );
  }, [reducedMotion, width, progress]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -BAND_WIDTH + progress.get() * (width + BAND_WIDTH) }],
  }));

  return (
    <AppView
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      className={cn('overflow-hidden rounded-lg bg-surface-muted', className)}
      style={style}
    >
      {reducedMotion || width === 0 ? null : (
        <Animated.View style={[styles.band, bandStyle]}>
          {STRIP_OPACITIES.map((opacity, index) => (
            <AppView key={index} style={[styles.strip, { opacity: opacity * bandStrength }]} />
          ))}
        </Animated.View>
      )}
    </AppView>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, flexDirection: 'row' },
  strip: { width: STRIP_WIDTH, height: '100%', backgroundColor: '#FFFFFF' },
});

/**
 * A stack of card-shaped placeholders (icon, title, subtitle, optional body), for lists of
 * cards such as offers or saved places.
 */
export function SkeletonCardList({
  count = 3,
  withBody = false,
}: {
  count?: number;
  withBody?: boolean;
}) {
  return (
    <AppView className="gap-3">
      {Array.from({ length: count }, (_, index) => (
        <AppView key={index} className="rounded-3xl bg-surface p-4">
          <AppView row className="items-center">
            <Skeleton className="mr-3 size-11 rounded-2xl" />
            <AppView className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
            </AppView>
          </AppView>
          {withBody ? <Skeleton className="mt-3 h-14 w-full rounded-2xl" /> : null}
        </AppView>
      ))}
    </AppView>
  );
}
