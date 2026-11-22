import { useReducedMotion } from '@/lib/motion';
import { Platform } from '@/lib/native';

export function useScreenTransitions() {
  const reducedMotion = useReducedMotion();
  const isIOS = Platform.OS === 'ios';

  return {
    push: reducedMotion
      ? ('fade' as const)
      : isIOS
        ? ('default' as const)
        : ('ios_from_right' as const),
    modal: reducedMotion ? ('fade' as const) : ('fade_from_bottom' as const),
    map: reducedMotion ? ('fade' as const) : ('fade_from_bottom' as const),
    tracking: reducedMotion ? ('fade' as const) : isIOS ? ('default' as const) : ('fade' as const),
    fade: 'fade' as const,
    animationDuration: reducedMotion ? 160 : 240,
  };
}

export function useStackAnimation() {
  return useScreenTransitions().push;
}
