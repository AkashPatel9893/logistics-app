import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import React, { useState } from 'react';

import { AppSpinner } from '@/components/ui/app-spinner';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface AppImageProps extends ExpoImageProps {
  className?: string;
  showLoadingSpinner?: boolean;
}

export function AppImage({
  className,
  showLoadingSpinner = false,
  transition = 200,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}: AppImageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <AppView className={cn('relative overflow-hidden', className)} style={props.style}>
      <ExpoImage
        style={{ width: '100%', height: '100%' }}
        transition={transition}
        onLoadStart={() => {
          setIsLoading(true);
          onLoadStart?.();
        }}
        onLoadEnd={() => {
          setIsLoading(false);
          onLoadEnd?.();
        }}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          onError?.(e);
        }}
        {...props}
      />

      {showLoadingSpinner && isLoading && !hasError && (
        <AppView className="absolute inset-0 items-center justify-center bg-neutral-100/60 dark:bg-neutral-900/60">
          <AppSpinner size="sm" variant="muted" />
        </AppView>
      )}
    </AppView>
  );
}

export function preloadImages(sources: string[]) {
  return ExpoImage.prefetch(sources);
}

export const Image = AppImage;
