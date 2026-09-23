import { Image, type ImageProps } from 'expo-image';
import { withUniwind } from 'uniwind';

const StyledImage = withUniwind(Image);

export interface AppImageProps extends ImageProps {
  className?: string;
}

/** expo-image with Uniwind `className` support and the app's default transition. */
export function AppImage({ transition = 200, ...props }: AppImageProps) {
  return <StyledImage transition={transition} {...props} />;
}
