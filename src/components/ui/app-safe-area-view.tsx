import type { ComponentPropsWithRef, ReactNode } from 'react';
import {
  SafeAreaListener,
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Uniwind, withUniwind } from 'uniwind';

import { cn } from '@/lib/cn';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export interface AppSafeAreaViewProps extends ComponentPropsWithRef<typeof SafeAreaView> {
  className?: string;
}

/** Root safe-area provider that keeps Uniwind `*-safe` utilities synchronized with native insets. */
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

export function AppSafeAreaView({ className, edges = [], ...props }: AppSafeAreaViewProps) {
  return (
    <StyledSafeAreaView
      edges={edges}
      className={cn('flex-1 bg-surface-muted', className)}
      {...props}
    />
  );
}
