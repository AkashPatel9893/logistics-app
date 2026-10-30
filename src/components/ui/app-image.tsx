import { Image, type ImageProps } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { withUniwind } from 'uniwind';

const StyledImage = withUniwind(Image);

export interface AppImageProps extends Omit<ImageProps, 'source'> {
  source?: ImageProps['source'] | ImageSourcePropType;
  className?: string;
}

/** expo-image with Uniwind `className` support and the app's default transition. */
export function AppImage({ transition = 200, source, ...props }: AppImageProps) {
  return <StyledImage transition={transition} source={source as any} {...props} />;
}
