import { useWindowDimensions } from 'react-native';

import { AppPressable, AppScrollView, AppText, AppView, Icon } from '@/components/ui';
import type { OfferBanner } from '@/features/home/coupons';
import { cn } from '@/lib/cn';

const THEME_STYLES: Record<OfferBanner['theme'], { card: string; cta: string }> = {
  orange: { card: 'bg-[#FF5500]', cta: 'bg-white/20' },
  dark: { card: 'bg-neutral-900 dark:bg-neutral-800', cta: 'bg-white/15' },
  green: { card: 'bg-emerald-600', cta: 'bg-white/20' },
};

const SIDE_PADDING = 20;
const CARD_GAP = 12;

export interface OfferBannerCarouselProps {
  banners: OfferBanner[];
  appliedCouponCode: string | null;
  onPressBanner: (banner: OfferBanner) => void;
}

export function OfferBannerCarousel({
  banners,
  appliedCouponCode,
  onPressBanner,
}: OfferBannerCarouselProps) {
  const { width } = useWindowDimensions();
  // Show most of one card with the next peeking in, so the row reads as scrollable.
  const cardWidth = Math.round((width - SIDE_PADDING * 2) * 0.86);

  if (banners.length === 0) return null;

  return (
    <AppView className="w-full mt-5">
      <AppScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, gap: CARD_GAP }}
      >
        {banners.map((banner) => {
          const styles = THEME_STYLES[banner.theme];
          const isApplied = !!banner.couponCode && banner.couponCode === appliedCouponCode;
          const ctaLabel = banner.couponCode ? (isApplied ? 'Applied' : 'Apply code') : 'Invite';

          return (
            <AppPressable
              key={banner.id}
              onPress={() => onPressBanner(banner)}
              accessibilityRole="button"
              accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
              style={{ width: cardWidth }}
              className={cn('rounded-[24px] p-4 min-h-[112px] justify-between', styles.card)}
            >
              <AppView>
                <AppText className="text-[17px] font-extrabold text-white leading-[22px]">
                  {banner.title}
                </AppText>
                <AppText className="text-[12px] text-white/85 mt-1">{banner.subtitle}</AppText>
              </AppView>
              <AppView
                className={cn(
                  'self-start flex-row items-center gap-1 mt-3 px-3 py-1.5 rounded-full',
                  styles.cta,
                )}
              >
                {isApplied && <Icon name="checkmark" size={11} color="#FFFFFF" />}
                <AppText className="text-[12px] font-bold text-white">{ctaLabel}</AppText>
              </AppView>
            </AppPressable>
          );
        })}
      </AppScrollView>
    </AppView>
  );
}
