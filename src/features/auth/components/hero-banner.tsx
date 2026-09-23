import { useWindowDimensions } from 'react-native';

import { AppImage, AppView } from '@/components/ui';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');
const HERO_BACKGROUND_IMAGE = require('@/assets/images/HeroBg.png');

export function HeroBanner() {
  const { height } = useWindowDimensions();
  const bannerHeight = Math.min(Math.max(height * 0.44, 320), 420);

  return (
    <AppView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="relative mx-4 mt-2 rounded-[32px] shadow-xl shadow-brand/20"
      style={{ height: bannerHeight }}
    >
      <AppImage
        source={HERO_BACKGROUND_IMAGE}
        contentFit="cover"
        className="absolute inset-0 rounded-[32px]"
      />
      <AppImage
        source={HERO_TRUCK_IMAGE}
        contentFit="contain"
        className="absolute -bottom-[70px] -right-1 h-[74%] w-[92%]"
      />
    </AppView>
  );
}
