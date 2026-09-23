import type { ImageSourcePropType } from 'react-native';

/** Banner artwork bundled with the app, keyed by the API's `imageKey`. */
const BANNER_IMAGES: Record<string, ImageSourcePropType> = {
  'first-delivery': require('@/assets/images/banners/first-delivery.png'),
  'truck-flat': require('@/assets/images/banners/truck-flat.png'),
  'bike-deal': require('@/assets/images/banners/bike-deal.png'),
};

export function getBannerImage(imageKey: string): ImageSourcePropType | undefined {
  return BANNER_IMAGES[imageKey];
}

/** Width ÷ height of the banner artwork. */
export const OFFER_BANNER_ASPECT_RATIO = 1200 / 440;
