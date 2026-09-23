import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Shared motion tokens (see the expo-animation skill). Entering/exiting UI
 * uses a strong ease-out; nothing uses ease-in.
 */
export const ENTER_EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const MOVE_EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
export const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1);

/** For Reanimated CSS transitions (`transitionTimingFunction`). */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export const DURATION = {
  press: 120,
  small: 180,
  enter: 260,
  sheet: 300,
} as const;

/** Stagger between list items entering, capped so long lists don't drag. */
export function staggerDelay(index: number, step = 40, max = 240): number {
  return Math.min(index * step, max);
}
