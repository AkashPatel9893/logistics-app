import { DURATION, LinearTransition, MOVE_EASE_IN_OUT, useReducedMotion } from '@/lib/motion';
import { Platform } from '@/lib/native';

const LAYOUT_TRANSITION = LinearTransition.duration(DURATION.small).easing(MOVE_EASE_IN_OUT);

/**
 * `layout` animation for containers and rows that reflow (lists, accordions).
 *
 * Returns `undefined` — so the reflow happens instantly but correctly — when:
 * - the system Reduce Motion setting is on: Reanimated skips the transition but
 *   can leave a container at its pre-change size, clipping (and blocking taps
 *   on) rows that were just added;
 * - on Android: with this Reanimated/RN version the transition never commits
 *   the new frames, so an expanded row stays clipped and its siblings overlap.
 */
export function useLayoutTransition() {
  const reducedMotion = useReducedMotion();
  return reducedMotion || Platform.OS === 'android' ? undefined : LAYOUT_TRANSITION;
}
