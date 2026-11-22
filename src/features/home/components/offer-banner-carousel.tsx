import { useState } from 'react';

import { AnimatedView, AppImage, AppPressable, AppScrollView } from '@/components/ui';
import type { OfferBanner } from '@/lib/api/models';
import { ENTER_EASE_OUT, FadeInRight } from '@/lib/motion';
import { useWindowDimensions } from '@/lib/native';

const SIDE_PADDING = 20;
const CARD_GAP = 12;
const CARD_WIDTH_RATIO = 0.86;
const OFFER_BANNER_ASPECT_RATIO = 1200 / 440;

export interface OfferBannerCarouselProps {
  banners: OfferBanner[];
  onSelectBanner?: (banner: OfferBanner) => void;
}

export function OfferBannerCarousel({ banners, onSelectBanner }: OfferBannerCarouselProps) {
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
            <AppPressable
              key={banner.id}
              onPress={() => onSelectBanner?.(banner)}
              disabled={!onSelectBanner}
              pressScale={0.98}
              accessibilityRole="button"
              accessibilityLabel={
                banner.altText ||
                (banner.couponCode ? `Apply offer ${banner.couponCode}` : 'View offer')
              }
              className="overflow-hidden rounded-[24px]"
            >
              <AppImage
                source={{ uri: banner.imageUrl }}
                contentFit="cover"
                onError={() => setFailedIds((prev) => new Set(prev).add(banner.id))}
                style={{ width: cardWidth, height: cardHeight }}
              />
            </AppPressable>
          );
        })}
      </AppScrollView>
    </AnimatedView>
  );
}
