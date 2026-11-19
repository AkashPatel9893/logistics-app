import type { ImageStyle } from 'expo-image';
import { useState } from 'react';

import { AppImage } from '@/components/ui';
import type { StyleProp } from '@/lib/native';
import { getBundledVehicleImage } from '@/lib/vehicle-images';

export interface VehicleImageProps {
  imageUrl: string | null | undefined;
  code?: string | null;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

export function VehicleImage({ imageUrl, code, className, style }: VehicleImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const useBundled = !imageUrl || failedUrl === imageUrl;

  return (
    <AppImage
      source={useBundled ? getBundledVehicleImage(code) : { uri: imageUrl }}
      contentFit="contain"
      priority="high"
      onError={() => imageUrl && setFailedUrl(imageUrl)}
      className={className}
      style={style}
    />
  );
}
