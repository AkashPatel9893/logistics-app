import { useState } from 'react';
import type { StyleProp } from 'react-native';
import type { ImageStyle } from 'expo-image';

import { AppImage, AppView, Icon } from '@/components/ui';
import type { ThemeColor } from '@/hooks/use-theme-color';

export interface VehicleImageProps {
  /** The backend's picture; missing or failing to load shows the fallback. */
  imageUrl: string | null | undefined;
  className?: string;
  style?: StyleProp<ImageStyle>;
  /** Size of the fallback truck icon; bigger pictures want a bigger icon. */
  fallbackIconSize?: number;
  /** Replaces the fallback tile's size, shape and background (defaults to `className`, grey). */
  fallbackClassName?: string;
  fallbackTone?: ThemeColor;
}

/**
 * A vehicle picture, or a plain grey truck-icon tile when there is none, so a missing image
 * never reads as the real vehicle (or as an empty hole).
 */
export function VehicleImage({
  imageUrl,
  className,
  style,
  fallbackIconSize = 22,
  fallbackClassName,
  fallbackTone = 'icon-subtle',
}: VehicleImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  if (showFallback) {
    return (
      <AppView
        center
        className={fallbackClassName ?? `rounded-xl bg-surface-muted ${className ?? ''}`}
        // A custom fallback sets its own size; the picture's size would stretch it.
        style={fallbackClassName ? undefined : (style as never)}
      >
        <Icon name="box.truck.fill" size={fallbackIconSize} tone={fallbackTone} />
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
