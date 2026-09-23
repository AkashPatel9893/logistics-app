import MaskedView from '@expo/ui/community/masked-view';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

import { AnimatedView as AnimatedAppView } from './animated-view';

/** Scroll distance (pt) over which the scrim fades in. */
const DEFAULT_FADE_DISTANCE = 48;
/** How far (pt) below the status bar the scrim keeps fading out. */
const FADE_TAIL_HEIGHT = 36;

/** Peak black overlay strength at the very top edge (0–1). */
const OVERLAY_OPACITY = 0.28;

/**
 * Eased ("scrim") gradient stops: [position %, share of peak opacity]. Fading
 * along a curve instead of linearly avoids the visible band a two-stop
 * gradient leaves where the fade starts.
 */
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
/** Mask for the blur: fully applied at the top, easing to none at the bottom. */
const BLUR_MASK_GRADIENT = easedGradient(1);
/** Light blur strength (1–100). */
const BLUR_INTENSITY = 12;

/**
 * Tracks scroll position for a full-bleed screen whose content runs under the
 * status bar. Pass `scrollHandler` to an Animated scroll view's `onScroll` and
 * render `<StatusBarScrim scrollY={scrollY} />`. Runs entirely on the UI thread.
 */
export function useStatusBarScrim(fadeDistance = DEFAULT_FADE_DISTANCE) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return { scrollY, scrollHandler, fadeDistance };
}

export interface StatusBarScrimProps {
  scrollY: SharedValue<number>;
  fadeDistance?: number;
  className?: string;
}

/**
 * Light blur plus a soft black gradient behind the status bar. Fades in as
 * content scrolls under it and eases out below the status bar, keeping light
 * status-bar icons readable without a visible band.
 */
export function StatusBarScrim({
  scrollY,
  fadeDistance = DEFAULT_FADE_DISTANCE,
  className,
}: StatusBarScrimProps) {
  const insets = useSafeAreaInsets();
  const height = insets.top + FADE_TAIL_HEIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, fadeDistance], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <AnimatedAppView
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height }, animatedStyle]}
      className={cn('absolute inset-x-0 top-0 z-40', className)}
    >
      {/*
        iOS only: Android's native blur needs the content wrapped in a
        BlurTargetView, so there the soft gradient alone is used.
      */}
      {Platform.OS === 'ios' ? (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={{ flex: 1, experimental_backgroundImage: BLUR_MASK_GRADIENT }} />
          }
        >
          <BlurView intensity={BLUR_INTENSITY} tint="default" style={StyleSheet.absoluteFill} />
        </MaskedView>
      ) : null}
      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: SCRIM_GRADIENT }]} />
    </AnimatedAppView>
  );
}
