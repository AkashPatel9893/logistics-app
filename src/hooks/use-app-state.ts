import { useEffect } from 'react';

import { AppState } from '@/lib/native';

export function useOnAppForeground(onForeground: () => void): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
    return () => sub.remove();
  }, [onForeground]);
}
