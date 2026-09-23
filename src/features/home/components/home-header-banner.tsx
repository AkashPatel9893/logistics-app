import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage, AppPressable, AppText, AppView, Icon } from '@/components/ui';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface HomeHeaderBannerProps {
  onSearchPress: () => void;
  onMicPress: () => void;
}

export function HomeHeaderBanner({ onSearchPress, onMicPress }: HomeHeaderBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppView className="relative w-full">
      <AppView
        className="relative w-full overflow-hidden rounded-b-[40px] bg-brand px-6"
        style={{ paddingTop: Math.max(insets.top, 20) + 12, paddingBottom: 48 }}
      >
        <AppView row className="min-h-[140px] justify-between">
          <AppView className="z-10 flex-1 pr-2">
            <AppText
              accessibilityRole="header"
              className="text-[34px] font-black leading-[38px] tracking-tight text-brand-foreground"
            >
              {'Delivering\nMore\nWorrying\nLess.'}
            </AppText>
          </AppView>
          <AppView center className="relative h-[150px] w-[170px]">
            <AppImage
              source={HERO_TRUCK_IMAGE}
              contentFit="contain"
              priority="high"
              style={styles.heroTruckImage}
            />
          </AppView>
        </AppView>
      </AppView>

      {/* Search pill overlapping the bottom of the banner */}
      <AppView className="z-20 -mt-6 px-5">
        <AppPressable
          onPress={onSearchPress}
          accessibilityLabel="Search drop location"
          pressedClassName="active:opacity-90"
          className="h-13 w-full flex-row items-center rounded-full border border-border/70 bg-search-field px-4"
          style={styles.searchShadow}
        >
          <AppView className="mr-2.5">
            <Icon name="magnifyingglass" size={18} tone="icon" weight="medium" />
          </AppView>
          <AppText className="flex-1 text-[15px] font-medium text-icon">Drop location?</AppText>
          <AppPressable
            onPress={onMicPress}
            hitSlop={8}
            accessibilityLabel="Voice search"
            pressedClassName="active:opacity-60"
            className="rounded-full p-1"
          >
            <Icon name="mic.fill" size={18} tone="icon-strong" weight="medium" />
          </AppPressable>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

// Native shadow/transform values kept exactly as designed.
const styles = StyleSheet.create({
  heroTruckImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.15 }],
  },
  searchShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
