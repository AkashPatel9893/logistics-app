import type { ReactNode } from 'react';
import {
  SafeAreaListener,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

export function AppSafeAreaProvider({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets);
        }}
      >
        {children}
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}

export const useAppSafeAreaInsets = useSafeAreaInsets;
