import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppPressable, AppText, AppView } from '@/components/ui';

import { MOCK_ACTIVE_ORDER } from '../mock-data';
import type { ActiveOrder } from '../types';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface ActiveOrderCardProps {
  order?: ActiveOrder;
  onPressOrder?: (order: ActiveOrder) => void;
}

export function ActiveOrderCard({ order = MOCK_ACTIVE_ORDER, onPressOrder }: ActiveOrderCardProps) {
  return (
    <AppView className="px-5 mt-5">
      {/* Orange Background Banner Card */}
      <AppView className="w-full bg-[#FF5500] rounded-[26px] p-4 overflow-hidden relative">
        {/* Banner Top Row */}
        <AppView className="flex-row items-center justify-between pb-3">
          <AppText className="text-[17px] font-bold text-white tracking-tight">
            Delivering More
          </AppText>
          <AppView className="w-16 h-10 items-end justify-center">
            <Image source={HERO_TRUCK_IMAGE} style={styles.miniTruckImage} contentFit="contain" />
          </AppView>
        </AppView>

        {/* Floating White Order Status Capsule */}
        <AppPressable
          onPress={() => onPressOrder?.(order)}
          className="w-full bg-white dark:bg-neutral-900 rounded-[20px] p-3 flex-row items-center justify-between shadow-sm active:opacity-95"
          style={styles.statusShadow}
        >
          {/* Left Orange Circle with Truck Icon */}
          <AppView className="w-11 h-11 bg-[#FF5500] rounded-full items-center justify-center mr-3">
            {Platform.OS === 'ios' ? (
              <SymbolView name="box.truck.fill" size={20} tintColor="#FFFFFF" />
            ) : (
              <AppText className="text-lg text-white">🚚</AppText>
            )}
          </AppView>

          {/* Center Info */}
          <AppView className="flex-1">
            <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              {order.orderNumber}
            </AppText>
            <AppText className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
              {order.status} · {order.estimatedTime}
            </AppText>
          </AppView>

          {/* Right Orange Arrow Button */}
          <AppView className="w-10 h-10 bg-[#FF5500] rounded-full items-center justify-center">
            {Platform.OS === 'ios' ? (
              <SymbolView name="arrow.right" size={16} tintColor="#FFFFFF" weight="bold" />
            ) : (
              <AppText className="text-base font-bold text-white">→</AppText>
            )}
          </AppView>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  miniTruckImage: {
    width: 60,
    height: 40,
    transform: [{ scale: 1.2 }],
  },
  statusShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
