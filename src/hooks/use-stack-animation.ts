import { useReducedMotion } from 'react-native-reanimated';

/** Native stack push animation: slides, or cross-fades when Reduce Motion is on. */
export function useStackAnimation() {
  return useReducedMotion() ? 'fade' : 'slide_from_right';
}
