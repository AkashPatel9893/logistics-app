import { StyleSheet } from 'react-native';
import { FadeInDown, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { DURATION, ENTER_EASE_OUT } from '@/lib/motion';

import type { ActiveOrderSummary } from '../hooks/use-active-order';

export interface ActiveOrderCardProps {
  order: ActiveOrderSummary;
  onPress: (order: ActiveOrderSummary) => void;
}

export function ActiveOrderCard({ order, onPress }: ActiveOrderCardProps) {
  return (
    <AnimatedView
      entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
      exiting={FadeOut.duration(DURATION.small)}
      className="px-5 pb-1 pt-2"
    >
      {/* One compact row: it sits above the tab bar, so it must not crowd the page. */}
      <AppPressable
        onPress={() => onPress(order)}
        accessibilityLabel={`${order.orderNumber}, ${order.status}. Track order`}
        className="w-full flex-row items-center rounded-[22px] bg-brand py-2 pl-2 pr-2.5"
        style={styles.statusShadow}
      >
        <AppView center className="mr-2.5 size-9 rounded-full bg-surface">
          <Icon name="box.truck.fill" size={17} tone="brand" />
        </AppView>
        <AppView className="flex-1">
          <AppText numberOfLines={1} className="text-[14px] font-bold text-brand-foreground">
            {order.orderNumber}
          </AppText>
          <AppText numberOfLines={1} className="text-[12px] font-medium text-brand-foreground/85">
            {[order.status, order.estimatedTime].filter(Boolean).join(' · ')}
          </AppText>
        </AppView>
        <AppView center className="ml-2 size-8 rounded-full bg-surface">
          <Icon name="arrow.right" size={14} tone="brand" weight="bold" />
        </AppView>
      </AppPressable>
    </AnimatedView>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  statusShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
