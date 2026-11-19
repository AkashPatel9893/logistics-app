import { useState } from 'react';

import { AnimatedView, AppImage, AppScrollView } from '@/components/ui';
import type { OfferBanner } from '@/lib/api/models';
import { ENTER_EASE_OUT, FadeInRight } from '@/lib/motion';
import { useWindowDimensions } from '@/lib/native';

const SIDE_PADDING = 20;
const CARD_GAP = 12;
const CARD_WIDTH_RATIO = 0.86;
const OFFER_BANNER_ASPECT_RATIO = 1200 / 440;

export interface OfferBannerCarouselProps {
  banners: OfferBanner[];
}

export function OfferBannerCarousel({ banners }: OfferBannerCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round((width - SIDE_PADDING * 2) * CARD_WIDTH_RATIO);
  const cardHeight = Math.round(cardWidth / OFFER_BANNER_ASPECT_RATIO);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  const visible = banners.filter((banner) => !failedIds.has(banner.id));

  if (visible.length === 0) return null;

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
        {visible.map((banner) => {
          return (
            <AppImage
              key={banner.id}
              source={{ uri: banner.imageUrl }}
              accessible
              accessibilityRole="image"
              accessibilityLabel={banner.altText}
              contentFit="cover"
              onError={() => setFailedIds((prev) => new Set(prev).add(banner.id))}
              className="overflow-hidden rounded-[24px]"
              style={{ width: cardWidth, height: cardHeight }}
            />
          );
        })}
      </AppScrollView>
    </AnimatedView>
  );
}
