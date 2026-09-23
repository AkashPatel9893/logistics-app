import { useWindowDimensions } from 'react-native';
import { FadeInRight } from 'react-native-reanimated';

import { AnimatedView, AppImage, AppScrollView, AppView } from '@/components/ui';
import type { OfferBanner } from '@/lib/api/models';
import { ENTER_EASE_OUT } from '@/lib/motion';

import { getBannerImage, OFFER_BANNER_ASPECT_RATIO } from '../offer-banner-images';

const SIDE_PADDING = 20;
const CARD_GAP = 12;
// Show most of one banner with the next peeking in, so the row reads as scrollable.
const CARD_WIDTH_RATIO = 0.86;

export interface OfferBannerCarouselProps {
  banners: OfferBanner[];
}

/** Swipeable row of promotional banner images (the coupon code is printed on each). */
export function OfferBannerCarousel({ banners }: OfferBannerCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round((width - SIDE_PADDING * 2) * CARD_WIDTH_RATIO);
  const cardHeight = Math.round(cardWidth / OFFER_BANNER_ASPECT_RATIO);
  const visible = banners.filter((banner) => getBannerImage(banner.imageKey));

  if (visible.length === 0) return <AppView className="mt-5" style={{ height: cardHeight }} />;

  return (
    <AnimatedView
      entering={FadeInRight.duration(260).easing(ENTER_EASE_OUT)}
      className="mt-5 w-full"
    >
      <AppScrollView
        horizontal
        snapToInterval={cardWidth + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, gap: CARD_GAP }}
      >
        {visible.map((banner) => (
          <AppImage
            key={banner.id}
            source={getBannerImage(banner.imageKey)}
            accessible
            accessibilityRole="image"
            accessibilityLabel={banner.altText}
            contentFit="cover"
            className="overflow-hidden rounded-[24px]"
            style={{ width: cardWidth, height: cardHeight }}
          />
        ))}
      </AppScrollView>
    </AnimatedView>
  );
}
