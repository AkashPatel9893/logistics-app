import { useEffect } from 'react';
import { AppState, type LayoutChangeEvent } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView, AppText, AppView } from '@/components/ui';
import { useNow } from '@/hooks/use-now';
import { formatFare } from '@/lib/format';

const FALLBACK_FREE_WAIT_SECONDS = 10 * 60;
const LOW_TIME_SECONDS = 60;
const SHIMMER_WIDTH = 72;

function mmss(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Live stop waiting/loading timer: shows a single decreasing countdown with a smoothly emptying
 * bar during the free window, then switches to paid overtime duration, rate, and accrued cost.
 */
export function WaitingBar({
  arrivedAt,
  freeWaitingUntil,
  ratePerMinute,
  stopType,
  className,
}: {
  arrivedAt: string;
  freeWaitingUntil?: string | null;
  ratePerMinute?: number | null;
  stopType?: 'pickup' | 'drop';
  className?: string;
}) {
  const now = useNow(1_000);
  const reducedMotion = useReducedMotion();

  const startMs = Date.parse(arrivedAt);
  const freeEndMs = freeWaitingUntil
    ? Date.parse(freeWaitingUntil)
    : startMs + FALLBACK_FREE_WAIT_SECONDS * 1_000;
  const totalMs = Math.max(1_000, freeEndMs - startMs);

  const remainingMs = freeEndMs - now;
  const overtime = remainingMs <= 0;
  const freeLeftSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const overtimeSeconds = Math.max(0, Math.floor(-remainingMs / 1_000));
  const lowTime = !overtime && freeLeftSeconds <= LOW_TIME_SECONDS;
  const accruedCharge =
    overtime && ratePerMinute != null && ratePerMinute > 0
      ? Math.round((overtimeSeconds / 60) * ratePerMinute * 100) / 100
      : null;

  const trackWidth = useSharedValue(0);
  const remaining = useSharedValue(Math.min(1, Math.max(0, remainingMs / totalMs)));
  const shimmer = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    const syncDrain = () => {
      cancelAnimation(remaining);
      const leftMs = Math.max(0, freeEndMs - Date.now());
      const ratio = Math.min(1, Math.max(0, leftMs / totalMs));
      remaining.set(ratio);
      if (leftMs > 0 && !reducedMotion) {
        remaining.set(withTiming(0, { duration: leftMs, easing: Easing.linear }));
      }
    };

    syncDrain();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncDrain();
    });

    return () => {
      sub.remove();
      cancelAnimation(remaining);
    };
  }, [freeEndMs, totalMs, reducedMotion, remaining]);

  useEffect(() => {
    if (!reducedMotion) return;
    remaining.set(Math.min(1, Math.max(0, remainingMs / totalMs)));
  }, [reducedMotion, remainingMs, totalMs, remaining]);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(shimmer);
      cancelAnimation(dotOpacity);
      dotOpacity.set(1);
      return;
    }

    dotOpacity.set(
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    if (!overtime) {
      shimmer.set(1);
      shimmer.set(
        withRepeat(
          withSequence(
            withTiming(-0.35, { duration: 1_500, easing: Easing.inOut(Easing.quad) }),
            withDelay(900, withTiming(1, { duration: 0 })),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(shimmer);
    }

    return () => {
      cancelAnimation(shimmer);
      cancelAnimation(dotOpacity);
    };
  }, [overtime, reducedMotion, shimmer, dotOpacity]);

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.set(e.nativeEvent.layout.width);
  };

  const barStyle = useAnimatedStyle(() => {
    const w = trackWidth.value;
    if (w <= 0) {
      return { opacity: 0, transform: [{ translateX: 0 }] };
    }
    return {
      opacity: remaining.value > 0.001 ? 1 : 0,
      transform: [{ translateX: -(1 - remaining.value) * w }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const w = trackWidth.value;
    return {
      transform: [{ translateX: shimmer.value * w }],
    };
  });

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const freeLabel =
    stopType === 'pickup'
      ? 'Free loading time'
      : stopType === 'drop'
        ? 'Free unloading time'
        : 'Free waiting';
  const paidLabel =
    stopType === 'pickup'
      ? 'Paid loading time'
      : stopType === 'drop'
        ? 'Paid unloading time'
        : 'Waiting charges';

  const dotColorClass = overtime ? 'bg-red-500' : lowTime ? 'bg-amber-500' : 'bg-brand';
  const barColorClass = lowTime ? 'bg-amber-500' : 'bg-brand';
  const timerColorClass = overtime
    ? 'text-red-600 dark:text-red-400'
    : lowTime
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-foreground';

  return (
    <AppView
      className={`rounded-2xl px-4 py-3 ${overtime ? 'bg-red-500/10' : 'bg-surface-muted'} ${className ?? ''}`}
    >
      <AppView row className="items-center justify-between gap-3">
        <AppView row className="flex-1 items-center gap-2">
          <AnimatedView style={dotStyle} className={`size-2 rounded-full ${dotColorClass}`} />
          <AppText
            numberOfLines={1}
            className={`text-[13px] font-semibold ${
              overtime ? 'text-red-600 dark:text-red-400' : 'text-foreground-secondary'
            }`}
          >
            {overtime ? paidLabel : freeLabel}
          </AppText>
        </AppView>

        <AppText
          style={{ fontVariant: ['tabular-nums'] }}
          className={`text-[15px] font-black ${timerColorClass}`}
        >
          {overtime ? mmss(overtimeSeconds) : mmss(freeLeftSeconds)}
        </AppText>
      </AppView>

      {!overtime ? (
        <AppView
          onLayout={handleTrackLayout}
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-border"
        >
          <AnimatedView
            style={barStyle}
            className={`h-full w-full overflow-hidden rounded-full ${barColorClass}`}
          >
            {!reducedMotion ? (
              <AnimatedView
                style={[shimmerStyle, { width: SHIMMER_WIDTH }]}
                className="h-full rounded-full bg-white/30"
              />
            ) : null}
          </AnimatedView>
        </AppView>
      ) : null}

      {ratePerMinute != null && ratePerMinute > 0 ? (
        <AppView row className={`${overtime ? 'mt-1.5' : 'mt-2'} items-center justify-between`}>
          <AppText
            className={`text-[11px] font-medium ${
              overtime ? 'text-red-600/80 dark:text-red-400/80' : 'text-muted'
            }`}
          >
            {overtime
              ? `${formatFare(ratePerMinute)}/min waiting charge`
              : `${formatFare(ratePerMinute)}/min after free time`}
          </AppText>
          {overtime && accruedCharge != null ? (
            <AppText
              style={{ fontVariant: ['tabular-nums'] }}
              className="text-[11px] font-bold text-red-600 dark:text-red-400"
            >
              +{formatFare(accruedCharge)} so far
            </AppText>
          ) : null}
        </AppView>
      ) : null}
    </AppView>
  );
}
