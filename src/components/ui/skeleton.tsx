import { useEffect, useState } from 'react';
import { useUniwind } from 'uniwind';

import { cn } from '@/lib/cn';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from '@/lib/motion';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from '@/lib/native';

import { AnimatedView } from './animated-view';
import { AppView } from './app-view';

const SWEEP_MS = 1300;
const STRIP_OPACITIES = [0.05, 0.12, 0.2, 0.26, 0.2, 0.12, 0.05];
const STRIP_WIDTH = 14;
const BAND_WIDTH = STRIP_OPACITIES.length * STRIP_WIDTH;

export interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ className, style }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
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
        <AnimatedView style={bandStyle} className="absolute inset-y-0 flex-row">
          {STRIP_OPACITIES.map((opacity, index) => (
            <AppView
              key={index}
              className="h-full w-3.5 bg-white"
              style={{ opacity: opacity * bandStrength }}
            />
          ))}
        </AnimatedView>
      )}
    </AppView>
  );
}

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
