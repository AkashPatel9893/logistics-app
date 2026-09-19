import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { AppPressable, AppText, AppView } from '@/components/ui';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface HomeHeaderBannerProps {
  onSearchPress?: () => void;
  onMicPress?: () => void;
}

export function HomeHeaderBanner({ onSearchPress, onMicPress }: HomeHeaderBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppView className="w-full relative">
      {/* Orange Hero Curved Container */}
      <AppView
        className="w-full bg-[#FF5500] rounded-b-[40px] px-6 overflow-hidden relative"
        style={{
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: 48,
        }}
      >
        <AppView className="flex-row items-center justify-between min-h-[140px]">
          {/* Headline */}
          <AppView className="flex-1 pr-2 z-10">
            <AppText className="text-[34px] font-black text-white leading-[38px] tracking-tight">
              Delivering{'\n'}More{'\n'}Worrying{'\n'}Less.
            </AppText>
          </AppView>

          {/* 3D Delivery Truck Illustration */}
          <AppView className="w-[170px] h-[150px] items-center justify-center relative">
            <Image
              source={HERO_TRUCK_IMAGE}
              style={styles.heroTruckImage}
              contentFit="contain"
              priority="high"
            />
          </AppView>
        </AppView>
      </AppView>

      {/* Floating Drop Location Search Bar Pill Overlapping Banner Bottom */}
      <AppView className="px-5 -mt-6 z-20">
        <AppPressable
          onPress={onSearchPress}
          className="w-full h-13 bg-[#ECEEF1] dark:bg-neutral-800 rounded-full flex-row items-center px-4 shadow-sm active:opacity-90 border border-neutral-200/70 dark:border-neutral-700"
          style={styles.searchShadow}
        >
          {/* Magnifying Glass Search Icon */}
          <AppView className="mr-2.5">
            {Platform.OS === 'ios' ? (
              <SymbolView name="magnifyingglass" size={18} tintColor="#6B7280" weight="medium" />
            ) : (
              <AppText className="text-base text-neutral-500">🔍</AppText>
            )}
          </AppView>

          {/* Search Placeholder / Input */}
          <TextInput
            placeholder="Drop location?"
            placeholderTextColor="#6B7280"
            className="flex-1 text-[15px] font-medium text-neutral-800 dark:text-neutral-100 p-0"
            editable={false}
            pointerEvents="none"
          />

          {/* Microphone Voice Icon */}
          <AppPressable
            onPress={onMicPress}
            hitSlop={8}
            className="p-1 rounded-full active:opacity-60"
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name="mic.fill" size={18} tintColor="#4B5563" weight="medium" />
            ) : (
              <AppText className="text-base text-neutral-600">🎙️</AppText>
            )}
          </AppPressable>
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
  searchShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
