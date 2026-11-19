import { DURATION, LinearTransition, MOVE_EASE_IN_OUT, useReducedMotion } from '@/lib/motion';
import { Platform } from '@/lib/native';

const LAYOUT_TRANSITION = LinearTransition.duration(DURATION.small).easing(MOVE_EASE_IN_OUT);

export function useLayoutTransition() {
  const reducedMotion = useReducedMotion();
  return reducedMotion || Platform.OS === 'android' ? undefined : LAYOUT_TRANSITION;
}
