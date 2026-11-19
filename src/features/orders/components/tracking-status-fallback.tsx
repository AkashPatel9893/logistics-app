import type { ReactNode } from 'react';

import {
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';

export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <AppView center className="flex-1 bg-canvas px-8">
      <FocusAwareStatusBar />
      {children}
    </AppView>
  );
}

export function TrackingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Trip" onBack={onBack} className="pb-3" />
      <Skeleton className="flex-1 rounded-none" />
      <AppView className="gap-3 rounded-t-[28px] bg-surface px-4 pb-10 pt-5">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <Skeleton className="mt-2 h-2 w-full rounded-full" />
        <AppView row className="mt-3 items-center">
          <Skeleton className="mr-3 size-12 rounded-full" />
          <AppView className="flex-1 gap-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </AppView>
        </AppView>
        <Skeleton className="mt-2 h-24 w-full rounded-2xl" />
      </AppView>
    </AppView>
  );
}

export function TrackingErrorState({
  error,
  orderId,
  onRetry,
  onHome,
}: {
  error: unknown;
  orderId?: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <CenteredMessage>
      <AppText className="text-center text-[17px] font-bold text-foreground">
        {getErrorMessage(error)}
      </AppText>
      <AppText className="mt-2 text-center text-[13px] text-muted">
        Order ID: {orderId ?? 'none'}
      </AppText>
      <Button label="Try Again" className="mt-6 self-stretch" onPress={onRetry} />
      <Button label="Back to Home" variant="ghost" className="mt-3 self-stretch" onPress={onHome} />
    </CenteredMessage>
  );
}

export function TrackingNotFoundState({ onHome }: { onHome: () => void }) {
  return (
    <CenteredMessage>
      <AppText className="text-center text-[17px] font-bold text-foreground">
        We couldn&apos;t find that order
      </AppText>
      <Button label="Back to Home" className="mt-6 self-stretch" onPress={onHome} />
    </CenteredMessage>
  );
}
