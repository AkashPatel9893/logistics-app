import Animated, {
  cancelAnimation,
  cubicBezier,
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  interpolate,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export {
  Animated,
  cancelAnimation,
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  interpolate,
  LinearTransition,
  scheduleOnRN,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
};

export const ENTER_EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const MOVE_EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export const DURATION = {
  press: 120,
  small: 180,
  enter: 260,
  sheet: 300,
} as const;

export function staggerDelay(index: number, step = 40, max = 240): number {
  return Math.min(index * step, max);
}

export function enterFromBelow(index = 0) {
  return FadeInDown.duration(DURATION.enter).delay(staggerDelay(index)).easing(ENTER_EASE_OUT);
}
