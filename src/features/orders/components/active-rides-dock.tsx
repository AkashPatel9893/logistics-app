import { useEffect, useState } from 'react';

import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import { AnimatedView, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { Gesture, GestureDetector } from '@/lib/gesture';
import { haptics } from '@/lib/haptics';
import {
  DURATION,
  ENTER_EASE_OUT,
  FadeInDown,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from '@/lib/motion';
import { useRouter } from '@/lib/navigation';

import { useActiveOrders, type ActiveOrderSummary } from '../hooks/use-active-orders';

const CARD_HEIGHT = 54;
const CARD_HEIGHT_WITH_DOTS = 62;
const ICON_SIZE = 38;
const DOT_SIZE = 5;
const DOT_ACTIVE_WIDTH = 14;
const DOCK_TOP_PADDING = 6;
const DOCK_TAB_BAR_GAP = 6;
const TAB_BAR_INSET_SLACK = 8;
const SWIPE_DISTANCE = 28;
const SWIPE_VELOCITY = 500;
const SWAP_MS = 260;

export function useActiveRidesInset(): number {
  const count = useActiveOrders().length;
  if (count === 0) return 0;
  return (
    (count > 1 ? CARD_HEIGHT_WITH_DOTS : CARD_HEIGHT) +
    DOCK_TOP_PADDING +
    DOCK_TAB_BAR_GAP -
    TAB_BAR_INSET_SLACK
  );
}

function Dot({ isActive }: { isActive: boolean }) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(isActive ? 1 : 0, { duration: DURATION.small }));
  }, [isActive, progress]);

  const style = useAnimatedStyle(() => ({
    width: DOT_SIZE + (DOT_ACTIVE_WIDTH - DOT_SIZE) * progress.get(),
    opacity: 0.4 + 0.6 * progress.get(),
  }));

  return <AnimatedView style={[{ height: DOT_SIZE }, style]} className="rounded-full bg-white" />;
}

function RideInfo({ order }: { order: ActiveOrderSummary }) {
  const subtitle = order.destination ? `To ${order.destination}` : order.orderNumber;

  return (
    <AppView row className="flex-1 items-center">
      <AppView className="flex-1 justify-center pr-2">
        <AppText numberOfLines={1} className="text-[14px] font-bold text-brand-foreground">
          {order.status}
        </AppText>
        <AppText numberOfLines={1} className="text-[11.5px] font-medium text-brand-foreground/85">
          {subtitle}
        </AppText>
      </AppView>
      {order.estimatedTime ? (
        <AppView row className="mr-2 gap-1 rounded-full bg-white/20 px-2 py-[3px]">
          <Icon name="clock" size={11} tone="brand-foreground" />
          <AppText className="text-[11.5px] font-bold tabular-nums text-brand-foreground">
            {order.estimatedTime}
          </AppText>
        </AppView>
      ) : null}
    </AppView>
  );
}

function useRideCarousel(count: number) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasSwapped, setHasSwapped] = useState(false);

  const currentIndex = Math.min(index, Math.max(count - 1, 0));
  const isMulti = count > 1;

  const swap = (step: 1 | -1) => {
    if (!isMulti) return;
    setDirection(step);
    setHasSwapped(true);
    setIndex((current) => (Math.min(current, count - 1) + step + count) % count);
    haptics.selection();
  };

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onEnd((event) => {
      const isSwipe =
        Math.abs(event.translationX) > SWIPE_DISTANCE || Math.abs(event.velocityX) > SWIPE_VELOCITY;
      if (!isSwipe) return;
      swap(event.translationX < 0 ? 1 : -1);
    });

  const entering = hasSwapped
    ? (direction === 1 ? SlideInRight : SlideInLeft).duration(SWAP_MS).easing(ENTER_EASE_OUT)
    : undefined;
  const exiting = (direction === 1 ? SlideOutLeft : SlideOutRight)
    .duration(SWAP_MS)
    .easing(ENTER_EASE_OUT);

  return { currentIndex, isMulti, swap, swipe, entering, exiting };
}

export function ActiveRidesDock() {
  const router = useRouter();
  const tabBarInset = useFloatingTabBarInset();
  const orders = useActiveOrders();
  const count = orders.length;
  const { currentIndex, isMulti, swap, swipe, entering, exiting } = useRideCarousel(count);
  const order = orders[currentIndex];

  if (!order) return null;

  const openOrder = () =>
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });

  return (
    <AnimatedView
      entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
      exiting={FadeOut.duration(DURATION.small)}
      className="absolute inset-x-0 z-20 px-5"
      style={{
        bottom: tabBarInset - TAB_BAR_INSET_SLACK + DOCK_TAB_BAR_GAP,
        paddingTop: DOCK_TOP_PADDING,
      }}
    >
      <GestureDetector gesture={swipe}>
        <AppPressable
          onPress={openOrder}
          accessibilityLabel={[
            order.status,
            order.destination ? `To ${order.destination}` : order.orderNumber,
            order.estimatedTime && `about ${order.estimatedTime}`,
            isMulti && `ride ${currentIndex + 1} of ${count}`,
            'Track order',
          ]
            .filter(Boolean)
            .join(', ')}
          accessibilityHint={isMulti ? 'Swipe sideways for the next ride' : undefined}
          accessibilityActions={
            isMulti
              ? [
                  { name: 'increment', label: 'Next ride' },
                  { name: 'decrement', label: 'Previous ride' },
                ]
              : undefined
          }
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') swap(1);
            if (event.nativeEvent.actionName === 'decrement') swap(-1);
          }}
          pressScale={0.98}
          className="overflow-hidden rounded-full bg-brand"
          style={{ height: isMulti ? CARD_HEIGHT_WITH_DOTS : CARD_HEIGHT }}
        >
          <AnimatedView
            key={order.id}
            entering={entering}
            exiting={exiting}
            className={
              isMulti
                ? 'absolute inset-0 flex-row pb-2.5 pl-2 pr-2 pt-2'
                : 'absolute inset-0 flex-row px-2'
            }
          >
            <AppView
              center
              className="mr-2.5 self-center rounded-full bg-surface"
              style={{ width: ICON_SIZE, height: ICON_SIZE }}
            >
              <Icon name="box.truck.fill" size={17} tone="brand" />
            </AppView>

            <RideInfo order={order} />

            <AppView center className="size-[30px] self-center rounded-full bg-surface">
              <Icon name="arrow.right" size={13} tone="brand" weight="bold" />
            </AppView>
          </AnimatedView>

          {isMulti ? (
            <AppView
              row
              pointerEvents="none"
              className="absolute inset-x-0 bottom-1.5 justify-center gap-1"
            >
              {orders.map((item, dotIndex) => (
                <Dot key={item.id} isActive={dotIndex === currentIndex} />
              ))}
            </AppView>
          ) : null}
        </AppPressable>
      </GestureDetector>
    </AnimatedView>
  );
}
