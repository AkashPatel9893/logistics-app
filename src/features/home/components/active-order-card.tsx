import { StyleSheet } from 'react-native';
import { FadeInDown, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppImage, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { DURATION, ENTER_EASE_OUT } from '@/lib/motion';

import type { ActiveOrderSummary } from '../hooks/use-active-order';

const HERO_TRUCK_IMAGE = require('@/assets/images/HeroTruck.png');

export interface ActiveOrderCardProps {
  order: ActiveOrderSummary;
  onPress: (order: ActiveOrderSummary) => void;
}

export function ActiveOrderCard({ order, onPress }: ActiveOrderCardProps) {
  return (
    <AnimatedView
      entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
      exiting={FadeOut.duration(DURATION.small)}
      className="mt-5 px-5"
    >
      <AppView className="relative w-full overflow-hidden rounded-[26px] bg-brand p-4">
        <AppView row className="justify-between pb-3">
          <AppText className="text-[17px] font-bold tracking-tight text-brand-foreground">
            Delivering More
          </AppText>
          <AppView className="h-10 w-16 items-end justify-center">
            <AppImage
              source={HERO_TRUCK_IMAGE}
              contentFit="contain"
              style={styles.miniTruckImage}
            />
          </AppView>
        </AppView>

        <AppPressable
          onPress={() => onPress(order)}
          accessibilityLabel={`${order.orderNumber}, ${order.status}. Track order`}
          pressedClassName="active:opacity-95"
          className="w-full flex-row items-center justify-between rounded-[20px] bg-surface p-3"
          style={styles.statusShadow}
        >
          <AppView center className="mr-3 size-11 rounded-full bg-brand">
            <Icon name="box.truck.fill" size={20} tone="brand-foreground" />
          </AppView>
          <AppView className="flex-1">
            <AppText className="text-[15px] font-bold text-foreground">{order.orderNumber}</AppText>
            <AppText className="mt-0.5 text-[12px] font-medium text-muted">
              {order.status} · {order.estimatedTime}
            </AppText>
          </AppView>
          <AppView center className="size-10 rounded-full bg-brand">
            <Icon name="arrow.right" size={16} tone="brand-foreground" weight="bold" />
          </AppView>
        </AppPressable>
      </AppView>
    </AnimatedView>
  );
}

// Native shadow/transform values kept exactly as designed.
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
