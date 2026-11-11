import { StatusBar as RNStatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { placeLine } from '@/features/trip/place-line';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface HomeHeaderBannerProps {
  pickupLabel?: string;
  pickupAddress?: string;
  isLoadingLocation?: boolean;
  /** Change the pickup point only. */
  onPress: () => void;
  /** Start a booking from the drop point. */
  onPressDrop: () => void;
}

export function HomeHeaderBanner({
  pickupLabel,
  pickupAddress,
  isLoadingLocation = false,
  onPress,
  onPressDrop,
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
        {/* Faint rings give the flat orange some depth. */}
        <AppView className="absolute -right-16 -top-20 size-64 rounded-full border-[28px] border-white/10" />
        <AppView className="absolute -left-10 bottom-[-70px] size-40 rounded-full bg-white/[0.06]" />
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

      {/* Route card overlapping the bottom curve: pickup on top, drop starts the booking. */}
      <AppView className="z-20 -mt-8 px-4">
        <AppView
          className="w-full rounded-[24px] border border-border/70 bg-surface px-2 py-1.5"
          style={styles.cardShadow}
        >
          <AppPressable
            onPress={onPress}
            accessibilityLabel={`Pick up from: ${formattedAddress}. Tap to change.`}
            accessibilityRole="button"
            pressScale={0.98}
            className="flex-row items-center rounded-[18px] px-2 py-2.5"
          >
            <AppView center className="mr-3 size-9 rounded-full bg-pickup/15">
              <AppView className="size-3 rounded-full border-[3px] border-pickup bg-surface" />
            </AppView>
            <AppView className="flex-1 pr-2">
              <AppText className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                Pick up from
              </AppText>
              <AppText
                numberOfLines={1}
                className="mt-0.5 text-[14.5px] font-semibold tracking-tight text-foreground"
              >
                {formattedAddress}
              </AppText>
            </AppView>
            <Icon name="chevron.right" size={17} tone="icon-subtle" weight="medium" />
          </AppPressable>

          {/* Dotted connector between the two stops, then the divider. */}
          <AppView row className="items-center">
            <AppView className="ml-[25px] h-3 w-0 border-l-2 border-dotted border-border-strong" />
            <AppView className="ml-[34px] mr-2 h-px flex-1 bg-border/70" />
          </AppView>

          <AppPressable
            onPress={onPressDrop}
            accessibilityLabel="Where is it going? Set the drop location"
            accessibilityRole="button"
            pressScale={0.98}
            className="flex-row items-center rounded-[18px] px-2 py-2.5"
          >
            <AppView center className="mr-3 size-9 rounded-full bg-brand/15">
              <Icon name="mappin" size={17} tone="brand" />
            </AppView>
            <AppText
              numberOfLines={1}
              className="flex-1 pr-2 text-[15px] font-bold text-foreground"
            >
              Where is it going?
            </AppText>
            <AppView center className="size-8 rounded-full bg-brand">
              <Icon name="arrow.right" size={14} tone="brand-foreground" weight="bold" />
            </AppView>
          </AppPressable>
        </AppView>
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
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
});
