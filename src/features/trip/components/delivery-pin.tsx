import { useEffect } from 'react';

import { AnimatedView, AppText, AppView, Icon } from '@/components/ui';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from '@/lib/motion';

const LIFT = 14;
const PULSE_MS = 1400;
const PULSE_REST_MS = 900;
const TAIL = 8;
const CALLOUT_WIDTH = 320;
const CALLOUT_OVERHANG = 32;

export type CalloutSide = 'center' | 'left' | 'right';

const CALLOUT_SIDE = {
  center: { left: -CALLOUT_WIDTH / 2 },
  right: { left: CALLOUT_OVERHANG - CALLOUT_WIDTH },
  left: { left: -CALLOUT_OVERHANG },
} as const;

const CALLOUT_PIN_X = {
  center: CALLOUT_WIDTH / 2,
  right: CALLOUT_WIDTH - CALLOUT_OVERHANG,
  left: CALLOUT_OVERHANG,
} as const;

const CALLOUT_ALIGN = {
  center: 'items-center',
  right: 'items-end',
  left: 'items-start',
} as const;

export interface DeliveryPinProps {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft?: number;
  paddingRight?: number;
  calloutSide?: CalloutSide;
  label?: string;
  isMoving?: boolean;
}

export function DeliveryPin({
  paddingTop,
  paddingBottom,
  paddingLeft = 0,
  paddingRight = 0,
  label,
  calloutSide = 'center',
  isMoving = false,
}: DeliveryPinProps) {
  const reducedMotion = useReducedMotion();
  const lift = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    lift.set(
      isMoving
        ? withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) })
        : withSpring(0, { dampingRatio: 0.45, duration: 450 }),
    );
    if (isMoving) {
      cancelAnimation(pulse);
      pulse.set(withTiming(0, { duration: 120 }));
    } else {
      pulse.set(0);
      pulse.set(
        withRepeat(
          withSequence(
            withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }),
            withDelay(PULSE_REST_MS, withTiming(1, { duration: 0 })),
            withTiming(0, { duration: 0 }),
          ),
          -1,
        ),
      );
    }
  }, [isMoving, reducedMotion, lift, pulse]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * lift.get() }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 - 0.25 * lift.get(),
    transform: [{ scale: 1 - 0.4 * lift.get() }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.get()),
    transform: [{ scale: 0.25 + 1.1 * pulse.get() }],
  }));

  return (
    <AppView pointerEvents="none" className="absolute inset-0">
      <AppView
        center
        className="flex-1"
        style={{ paddingTop, paddingBottom, paddingLeft, paddingRight }}
      >
        <AppView className="size-0">
          {reducedMotion ? null : (
            <AnimatedView
              style={pulseStyle}
              className="absolute -left-[20px] -top-[20px] size-[40px] rounded-full border-2 border-brand bg-brand/20"
            />
          )}
          <AnimatedView
            style={shadowStyle}
            className="absolute -left-[5px] -top-[2.5px] h-[5px] w-[10px] rounded-full bg-slate-900"
          />
          {label ? (
            <AnimatedView
              style={[CALLOUT_SIDE[calloutSide], pinStyle]}
              className={`absolute bottom-[54px] w-[320px] ${CALLOUT_ALIGN[calloutSide]}`}
            >
              <AppView className="rounded-full bg-neutral-900 px-3 py-1 shadow-callout dark:bg-neutral-800">
                <AppText className="text-[11px] font-semibold text-white">{label}</AppText>
              </AppView>
              <AppView
                style={{ left: CALLOUT_PIN_X[calloutSide] - TAIL / 2 }}
                className="absolute -bottom-[3px] size-[8px] rotate-45 rounded-[1.5px] bg-neutral-900 dark:bg-neutral-800"
              />
            </AnimatedView>
          ) : null}
          <AnimatedView
            style={pinStyle}
            className="absolute bottom-0 -left-[19px] w-[38px] items-center"
          >
            <AppView
              center
              className="size-[38px] rounded-full border-[3px] border-white bg-brand shadow-pin"
            >
              <Icon name="mappin" size={18} tone="brand-foreground" />
            </AppView>
            <AppView className="-mt-0.5 h-2 w-[3px] rounded-b-sm bg-brand" />
          </AnimatedView>
        </AppView>
      </AppView>
    </AppView>
  );
}
