import type { ComponentPropsWithRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export interface AppSafeAreaViewProps extends ComponentPropsWithRef<typeof SafeAreaView> {
  className?: string;
}

export function AppSafeAreaView({ className, edges = [], ...props }: AppSafeAreaViewProps) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-surface-muted', className)} {...props} />
  );
}
