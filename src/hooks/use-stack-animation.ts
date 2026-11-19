import { useReducedMotion } from '@/lib/motion';

export function useStackAnimation() {
  return useReducedMotion() ? 'fade' : 'slide_from_right';
}
