import { FlashList, type FlashListProps, type FlashListRef } from '@shopify/flash-list';
import type { ReactNode, Ref } from 'react';
import { withUniwind, type ApplyUniwind } from 'uniwind';

import { cn } from '@/lib/cn';

import { AppSpinner } from './app-spinner';
import { AppText } from './app-text';
import { AppView } from './app-view';

const StyledFlashList = withUniwind(FlashList) as <T>(
  props: ApplyUniwind<FlashListProps<T>> & { ref?: Ref<FlashListRef<T>> },
) => ReactNode;

interface EmptyListProps {
  isLoading: boolean;
  message: string;
}

function EmptyList({ isLoading, message }: EmptyListProps) {
  return (
    <AppView center className="min-h-[220px] flex-1 py-10">
      {isLoading ? (
        <AppSpinner size="large" />
      ) : (
        <AppView center className="gap-2">
          <AppText className="text-3xl">📦</AppText>
          <AppText className="text-center text-sm font-medium text-muted">{message}</AppText>
        </AppView>
      )}
    </AppView>
  );
}

export interface AppFlatListProps<T> extends FlashListProps<T> {
  ref?: Ref<FlashListRef<T>>;
  className?: string;
  contentContainerClassName?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function AppFlatList<T>({
  className,
  contentContainerClassName,
  emptyMessage = 'No items found',
  isLoading = false,
  ListEmptyComponent,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...props
}: AppFlatListProps<T>) {
  return (
    <StyledFlashList<T>
      className={cn('flex-1', className)}
      contentContainerClassName={contentContainerClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListEmptyComponent={
        ListEmptyComponent ?? <EmptyList isLoading={isLoading} message={emptyMessage} />
      }
      {...props}
    />
  );
}

export const AppFlashList = AppFlatList;
export type AppFlashListProps<T> = AppFlatListProps<T>;
export type AppFlatListRef<T> = FlashListRef<T>;
