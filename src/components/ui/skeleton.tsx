import React from 'react';
import { View, ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export interface SkeletonProps extends ViewProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-2xl',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <View
      className={cn('bg-neutral-200 animate-pulse', roundedMap[rounded], className)}
      {...props}
    />
  );
}
