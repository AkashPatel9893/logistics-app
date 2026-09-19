import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { AppView } from '@/components/ui/app-view';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');
const HERO_TRUCK_IMAGE_BG = require('@/assets/images/HeroBg.png');

export function HeroBanner() {
  const { height } = useWindowDimensions();
  const bannerHeight = Math.min(Math.max(height * 0.44, 320), 420);

  return (
    <AppView
      className="rounded-[32px] relative mx-4 mt-2 shadow-xl shadow-orange-500/20"
      style={{ height: bannerHeight }}
    >
      <Image
        source={HERO_TRUCK_IMAGE_BG}
        style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
        contentFit="cover"
      />

      <Image
        source={HERO_TRUCK_IMAGE}
        style={{
          position: 'absolute',
          right: -4,
          bottom: -70,
          width: '92%',
          height: '74%',
        }}
        contentFit="contain"
      />
    </AppView>
  );
}
