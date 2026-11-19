import { useEffect, useState } from 'react';

import { AppState, type AppStateStatus } from '@/lib/native';

const KNOWN_APP_STATES = new Set<string>([
  'active',
  'background',
  'inactive',
  'extension',
  'unknown',
]);

function toAppStateStatus(value: string | null | undefined): AppStateStatus {
  return value && KNOWN_APP_STATES.has(value) ? (value as AppStateStatus) : 'unknown';
}

/** Tracks the reactive foreground/background state of the app. */
export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(() =>
    toAppStateStatus(AppState.currentState),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);

  return appState;
}

/** Runs `onForeground` whenever the app returns to the `'active'` state. */
export function useOnAppForeground(onForeground: () => void): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
    return () => sub.remove();
  }, [onForeground]);
}
