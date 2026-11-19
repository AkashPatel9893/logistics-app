import { Image, type ImageProps } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { withUniwind } from 'uniwind';

const StyledImage = withUniwind(Image);

export interface AppImageProps extends Omit<ImageProps, 'source'> {
  source?: ImageProps['source'] | ImageSourcePropType;
  className?: string;
}

export function AppImage({
  transition = 200,
  cachePolicy = 'memory-disk',
  source,
  ...props
}: AppImageProps) {
  return (
    <StyledImage
      transition={transition}
      cachePolicy={cachePolicy}
      source={source as any}
      {...props}
    />
  );
}
