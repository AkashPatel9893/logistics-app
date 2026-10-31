import { useState } from 'react';
import type { StyleProp } from 'react-native';
import type { ImageStyle } from 'expo-image';

import { AppImage, AppView, Icon } from '@/components/ui';

export interface VehicleImageProps {
  /** The backend's picture; missing or failing to load shows the fallback. */
  imageUrl: string | null | undefined;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * A vehicle picture, or a plain grey truck-icon tile when there is none, so a missing image
 * never reads as the real vehicle (or as an empty hole).
 */
export function VehicleImage({ imageUrl, className, style }: VehicleImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  if (showFallback) {
    return (
      <AppView
        center
        className={`rounded-xl bg-surface-muted ${className ?? ''}`}
        style={style as never}
      >
        <Icon name="box.truck.fill" size={22} tone="icon-subtle" />
      </AppView>
    );
  }
  return (
    <AppImage
      source={{ uri: imageUrl }}
      contentFit="contain"
      priority="high"
      onError={() => setFailedUrl(imageUrl)}
      className={className}
      style={style}
    />
  );
}
