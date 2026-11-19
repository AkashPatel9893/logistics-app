import { AppImage, AppView } from '@/components/ui';
import { useWindowDimensions } from '@/lib/native';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.webp');
const HERO_BACKGROUND_IMAGE = require('@/assets/images/HeroBg.webp');

const TRUCK_OVERHANG = 70;

export function HeroBanner() {
  const { height } = useWindowDimensions();
  const bannerHeight = Math.min(Math.max(height * 0.44, 320), 420);

  return (
    <AppView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // Cached as a GPU texture so it is not re-drawn every frame while the keyboard scrolls the
      // screen. A cached layer clips to its bounds, so it is TRUCK_OVERHANG taller than the card
      // and the truck overhangs the card's bottom edge inside that extra space.
      renderToHardwareTextureAndroid
      className="mx-4 mt-2"
      style={{ height: bannerHeight + TRUCK_OVERHANG }}
    >
      <AppView
        className="rounded-[32px] bg-brand shadow-xl shadow-brand/20"
        style={{ height: bannerHeight }}
      >
        <AppImage
          source={HERO_BACKGROUND_IMAGE}
          contentFit="cover"
          className="absolute inset-0 rounded-[32px]"
        />
      </AppView>
      <AppImage
        source={HERO_TRUCK_IMAGE}
        contentFit="contain"
        className="absolute bottom-0 right-0 w-[92%]"
        style={{ height: bannerHeight * 0.74 }}
      />
    </AppView>
  );
}
