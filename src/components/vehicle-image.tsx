import type { ImageStyle } from 'expo-image';
import { useState } from 'react';

import { AppImage } from '@/components/ui';
import type { StyleProp } from '@/lib/native';
import { getBundledVehicleImage } from '@/lib/vehicle-images';

export interface VehicleImageProps {
  /** The backend's picture; missing or failing to load shows the picture bundled for `code`. */
  imageUrl: string | null | undefined;
  /** Vehicle type code (e.g. TATA_ACE), picks the bundled fallback picture. */
  code?: string | null;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

/** A vehicle picture: the backend's, or the one bundled with the app for that vehicle type. */
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
