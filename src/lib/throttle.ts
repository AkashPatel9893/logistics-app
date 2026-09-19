import { useCallback, useEffect, useRef } from 'react';

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit = 800,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 800,
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(0);
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRan.current >= delay) {
        lastRan.current = now;
        callbackRef.current(...args);
      }
    },
    [delay],
  );
}
