import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

import { AppSpinner } from '@/components/ui/app-spinner';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface EmptyListProps {
  isLoading?: boolean;
  message?: string;
  className?: string;
}

export const EmptyList = React.memo(
  ({ isLoading = false, message = 'Sorry! No data found', className }: EmptyListProps) => {
    return (
      <AppView className={cn('min-h-[220px] flex-1 items-center justify-center py-10', className)}>
        {isLoading ? (
          <AppSpinner size="large" variant="primary" />
        ) : (
          <AppView className="items-center justify-center gap-2">
            <AppText className="text-3xl">📦</AppText>
            <AppText className="text-neutral-500 dark:text-neutral-400 text-sm font-medium text-center">
              {message}
            </AppText>
          </AppView>
        )}
      </AppView>
    );
  },
);

EmptyList.displayName = 'EmptyList';

export interface AppFlatListProps<T> extends FlatListProps<T> {
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
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  initialNumToRender = 10,
  windowSize = 5,
  ...props
}: AppFlatListProps<T>) {
  return (
    <FlatList<T>
      className={cn('flex-1', className)}
      contentContainerClassName={cn('grow', contentContainerClassName)}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      removeClippedSubviews={removeClippedSubviews}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      initialNumToRender={initialNumToRender}
      windowSize={windowSize}
      ListEmptyComponent={
        ListEmptyComponent ?? <EmptyList isLoading={isLoading} message={emptyMessage} />
      }
      {...props}
    />
  );
}

export const List = AppFlatList;
