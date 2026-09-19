import React from 'react';
import { View } from 'react-native';

import { AppImage } from '@/components/ui/app-image';
import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-8 h-8 rounded-full', text: 'text-xs' },
  md: { box: 'w-10 h-10 rounded-full', text: 'text-sm' },
  lg: { box: 'w-14 h-14 rounded-full', text: 'text-base' },
  xl: { box: 'w-20 h-20 rounded-full', text: 'text-xl' },
};

export function Avatar({ source, name = '', size = 'md', className }: AvatarProps) {
  const currentSize = sizeMap[size];
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (source) {
    return (
      <View
        className={cn(
          'overflow-hidden bg-neutral-200 border border-neutral-100',
          currentSize.box,
          className,
        )}
      >
        <AppImage source={source} className="w-full h-full" contentFit="cover" />
      </View>
    );
  }

  return (
    <View
      className={cn(
        'items-center justify-center bg-orange-100 border border-orange-200',
        currentSize.box,
        className,
      )}
    >
      <AppText className={cn('font-bold text-orange-700', currentSize.text)}>
        {initials || '?'}
      </AppText>
    </View>
  );
}
