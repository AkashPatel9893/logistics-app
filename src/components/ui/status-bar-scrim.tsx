import MaskedView from '@expo/ui/community/masked-view';
import { BlurView } from 'expo-blur';
import { withUniwind } from 'uniwind';

import { cn } from '@/lib/cn';
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from '@/lib/motion';
import { Platform } from '@/lib/native';

import { AnimatedView } from './animated-view';
import { useAppSafeAreaInsets } from './app-safe-area-view';
import { AppView } from './app-view';

const StyledMaskedView = withUniwind(MaskedView);
const StyledBlurView = withUniwind(BlurView);

const DEFAULT_FADE_DISTANCE = 48;
const FADE_TAIL_HEIGHT = 36;

const OVERLAY_OPACITY = 0.28;

const EASED_STOPS: readonly [number, number][] = [
  [0, 1],
  [19, 0.85],
  [34, 0.68],
  [47, 0.51],
  [59, 0.36],
  [70, 0.23],
  [80, 0.13],
  [89, 0.05],
  [100, 0],
];

function easedGradient(peakOpacity: number): string {
  const stops = EASED_STOPS.map(
    ([position, share]) => `rgba(0,0,0,${(peakOpacity * share).toFixed(3)}) ${position}%`,
  );
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

const SCRIM_GRADIENT = easedGradient(OVERLAY_OPACITY);
const BLUR_MASK_GRADIENT = easedGradient(1);
const BLUR_INTENSITY = 12;

export function useStatusBarScrim(fadeDistance = DEFAULT_FADE_DISTANCE) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  return { scrollY, scrollHandler, fadeDistance };
}

export interface StatusBarScrimProps {
  scrollY: SharedValue<number>;
  fadeDistance?: number;
  className?: string;
}

export function StatusBarScrim({
  scrollY,
  fadeDistance = DEFAULT_FADE_DISTANCE,
  className,
}: StatusBarScrimProps) {
  const insets = useAppSafeAreaInsets();
  const height = insets.top + FADE_TAIL_HEIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, fadeDistance], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <AnimatedView
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height }, animatedStyle]}
      className={cn('absolute inset-x-0 top-0 z-40', className)}
    >
      {Platform.OS === 'ios' ? (
        <StyledMaskedView
          className="absolute inset-0"
          maskElement={
            <AppView
              className="flex-1"
              style={{ experimental_backgroundImage: BLUR_MASK_GRADIENT }}
            />
          }
        >
          <StyledBlurView intensity={BLUR_INTENSITY} tint="default" className="absolute inset-0" />
        </StyledMaskedView>
      ) : null}
      <AppView
        className="absolute inset-0"
        style={{ experimental_backgroundImage: SCRIM_GRADIENT }}
      />
    </AnimatedView>
  );
}
