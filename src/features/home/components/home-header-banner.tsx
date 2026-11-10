import { StatusBar as RNStatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { placeLine } from '@/features/trip/place-line';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface HomeHeaderBannerProps {
  pickupLabel?: string;
  pickupAddress?: string;
  isLoadingLocation?: boolean;
  onPress: () => void;
}

export function HomeHeaderBanner({
  pickupLabel,
  pickupAddress,
  isLoadingLocation = false,
  onPress,
}: HomeHeaderBannerProps) {
  const insets = useSafeAreaInsets();

  const formattedAddress =
    placeLine(pickupLabel, pickupAddress) ||
    (isLoadingLocation ? 'Locating your pickup point...' : 'Tap to set address on map');

  const topInset = Math.max(RNStatusBar.currentHeight ?? 0, insets.top, 32) + 14;

  return (
    <AppView className="relative w-full">
      {/* Hero Banner with truck graphic */}
      <AppView
        className="relative w-full overflow-hidden rounded-b-[36px] bg-brand px-6"
        style={{ paddingTop: topInset, paddingBottom: 46 }}
      >
        <AppView row className="min-h-[136px] justify-between">
          <AppView className="z-10 shrink-0 justify-center pr-2">
            <AppText
              accessibilityRole="header"
              className="text-[32px] font-black leading-[36px] tracking-tight text-brand-foreground"
            >
              {'Delivering\nMore\nWorrying\nLess.'}
            </AppText>
          </AppView>
          <AppView center className="relative h-[140px] max-w-[165px] flex-1">
            <AppImage
              source={HERO_TRUCK_IMAGE}
              contentFit="contain"
              priority="high"
              style={styles.heroTruckImage}
            />
          </AppView>
        </AppView>
      </AppView>

      {/* Ryno Brand Pickup Card overlapping bottom curve of banner */}
      <AppView className="z-20 -mt-7 px-4">
        <AppPressable
          onPress={onPress}
          accessibilityLabel={`Pick up from: ${formattedAddress}. Tap to change.`}
          accessibilityRole="button"
          pressScale={0.98}
          className="w-full flex-row items-center rounded-[20px] border border-border/80 bg-surface px-4 py-3.5 shadow-sm"
          style={styles.cardShadow}
        >
          {/* Emerald green circle with white upward arrow */}
          <AppView
            center
            className="mr-3.5 size-10 rounded-full bg-emerald-500"
            style={styles.pickupIconShadow}
          >
            <Icon name="arrow.up" size={17} color="#FFFFFF" weight="bold" />
          </AppView>

          {/* 2-line clean pickup details */}
          <AppView className="flex-1 pr-2">
            <AppText
              numberOfLines={1}
              className="text-[15px] font-bold tracking-tight text-foreground"
            >
              Pick up from
            </AppText>
            <AppText numberOfLines={1} className="mt-0.5 text-[13px] font-normal text-muted">
              {formattedAddress}
            </AppText>
          </AppView>

          {/* Minimalist sleek chevron */}
          <AppView className="pl-1">
            <Icon name="chevron.right" size={18} tone="icon-subtle" weight="medium" />
          </AppView>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  heroTruckImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.15 }],
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  pickupIconShadow: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
});
