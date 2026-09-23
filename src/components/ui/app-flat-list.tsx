import { FlatList, type FlatListProps } from 'react-native';

import { cn } from '@/lib/cn';

import { AppSpinner } from './app-spinner';
import { AppText } from './app-text';
import { AppView } from './app-view';

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
  ...props
}: AppFlatListProps<T>) {
  return (
    <FlatList<T>
      className={cn('flex-1', className)}
      contentContainerClassName={cn('grow', contentContainerClassName)}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListEmptyComponent={
        ListEmptyComponent ?? <EmptyList isLoading={isLoading} message={emptyMessage} />
      }
      {...props}
    />
  );
}
