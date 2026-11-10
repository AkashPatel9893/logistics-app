import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView, AppText, AppView, Icon } from '@/components/ui';

/** How far the pin rises while the map is being dragged. */
const LIFT = 14;
const PULSE_SIZE = 40;
const PULSE_MS = 1400;
const PULSE_REST_MS = 900;
const PIN_HEAD = 38;
/** Head plus stem above the tip, and the gap to the callout's tail (dp). */
const CALLOUT_BOTTOM = 54;
const TAIL = 8;
const CALLOUT_WIDTH = 320;
/** How far the callout may reach past the pin on its outer side when the pin is near an edge. */
const CALLOUT_OVERHANG = 32;

export type CalloutSide = 'center' | 'left' | 'right';

const CALLOUT_SIDE = {
  center: { left: -CALLOUT_WIDTH / 2 },
  // Pin near the right edge: the callout ends just past the pin and extends to the left.
  right: { left: CALLOUT_OVERHANG - CALLOUT_WIDTH },
  left: { left: -CALLOUT_OVERHANG },
} as const;

/** Where the pin's head is inside the callout box, so the tail points at it. */
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
  /** Top/bottom insets of the visible map area, so the pin sits at its center. */
  paddingTop: number;
  paddingBottom: number;
  /** Side insets: the pin stands off-center when the path to the user's dot is framed. */
  paddingLeft?: number;
  paddingRight?: number;
  /** Which way the callout extends: inward when the pin stands near a screen side. */
  calloutSide?: CalloutSide;
  /** Callout above the pin; omitted for none. */
  label?: string;
  /** The map is moving under the pin: it lifts, and the pulse stops until it lands. */
  isMoving?: boolean;
}

/**
 * Fixed crosshair pin: the map moves underneath it to choose a location.
 * At rest a ring pulses out from the tip (like Porter's); while the map is
 * dragged the pin lifts off and its shadow shrinks, then it drops back with a
 * small bounce, so it reads as being picked up and set down.
 */
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
        // A beat, then a rest at the end value (invisible, opacity 0): the UI thread draws the
        // ring only part of the time, which matters on slow phones and for battery.
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
        {/*
          A zero-size anchor exactly at the map center. Everything hangs off it, so the pin's tip
          lands on the center whatever the callout's height, and the line to the pin meets the tip.
        */}
        <AppView style={styles.anchor}>
          {/* Ground spot under the tip: pulse ring and shadow stay put while the pin lifts. */}
          {reducedMotion ? null : (
            <AnimatedView
              style={[styles.pulse, pulseStyle]}
              className="rounded-full border-2 border-brand bg-brand/20"
            />
          )}
          <AnimatedView
            style={[styles.groundShadow, shadowStyle]}
            className="rounded-full bg-slate-900"
          />
          {/* The callout hangs over the head; near a screen side it extends inward, not off-screen. */}
          {label ? (
            <AnimatedView
              style={[styles.callout, CALLOUT_SIDE[calloutSide], pinStyle]}
              className={CALLOUT_ALIGN[calloutSide]}
            >
              <AppView
                style={styles.calloutShadow}
                className="rounded-full bg-neutral-900 px-3 py-1 dark:bg-neutral-800"
              >
                <AppText className="text-[11px] font-semibold text-white">{label}</AppText>
              </AppView>
              {/* Tail pointing down at the pin. */}
              <AppView
                style={[styles.tail, { left: CALLOUT_PIN_X[calloutSide] - TAIL / 2 }]}
                className="bg-neutral-900 dark:bg-neutral-800"
              />
            </AnimatedView>
          ) : null}
          <AnimatedView style={[styles.pinStack, pinStyle]} className="items-center">
            <AppView
              center
              className="size-[38px] rounded-full border-[3px] border-white bg-brand"
              style={styles.pinShadow}
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

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  pinShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  calloutShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tail: {
    position: 'absolute',
    bottom: -TAIL / 2 + 1,
    width: TAIL,
    height: TAIL,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1.5,
  },
  anchor: { width: 0, height: 0 },
  // Bottom edge (the tip) sits on the anchor.
  pinStack: { position: 'absolute', bottom: 0, left: -PIN_HEAD / 2, width: PIN_HEAD },
  callout: { position: 'absolute', bottom: CALLOUT_BOTTOM, width: CALLOUT_WIDTH },
  pulse: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    left: -PULSE_SIZE / 2,
    top: -PULSE_SIZE / 2,
  },
  groundShadow: { position: 'absolute', width: 10, height: 5, left: -5, top: -2.5 },
});
