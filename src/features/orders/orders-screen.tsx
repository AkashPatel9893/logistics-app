import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppPressable,
  AppSpinner,
  AppScrollView,
  AppText,
  AppView,
  Card,
  FocusAwareStatusBar,
  Icon,
} from '@/components/ui';
import { isActiveOrder, useOrders } from '@/hooks/use-orders';
import type { Order } from '@/lib/api/models';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';

import { OrderCard } from './components/order-card';

const itemEntering = (index: number) =>
  FadeInDown.duration(DURATION.enter).delay(staggerDelay(index)).easing(ENTER_EASE_OUT);

function EmptyUpcoming({ onBook }: { onBook: () => void }) {
  return (
    <Card className="mb-6">
      <AppText className="text-[15px] font-bold text-foreground">
        You have no upcoming trips
      </AppText>
      <AppPressable onPress={onBook} className="mt-1.5 flex-row items-center gap-1.5 self-start">
        <AppText className="text-[14px] font-semibold text-brand">Reserve your trip</AppText>
        <Icon name="arrow.right" size={13} tone="brand" />
      </AppPressable>
    </Card>
  );
}

export function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ordersQuery = useOrders();

  const { upcoming, past } = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return {
      upcoming: orders.filter(isActiveOrder),
      past: orders.filter((order) => !isActiveOrder(order)),
    };
  }, [ordersQuery.data]);

  const openOrder = (order: Order) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  return (
    // Inset on the container (not the scroll view) so content and the refresh
    // spinner stay below the status bar.
    <AppView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <FocusAwareStatusBar />
      <AppScrollView
        contentContainerClassName="px-5 pb-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isRefetching}
            onRefresh={() => ordersQuery.refetch()}
          />
        }
      >
        <AppText
          accessibilityRole="header"
          className="mb-5 text-[32px] font-extrabold tracking-tight text-foreground"
        >
          Orders
        </AppText>

        <AppText accessibilityRole="header" className="mb-3 text-[18px] font-bold text-foreground">
          Upcoming
        </AppText>
        {ordersQuery.isPending ? (
          <AppView className="py-10">
            <AppSpinner tone="brand" />
          </AppView>
        ) : upcoming.length === 0 ? (
          <EmptyUpcoming onBook={() => router.push('/home')} />
        ) : (
          <AppView className="mb-3">
            {upcoming.map((order, index) => (
              <AnimatedView key={order.id} entering={itemEntering(index)}>
                <OrderCard order={order} onPress={openOrder} />
              </AnimatedView>
            ))}
          </AppView>
        )}

        <AppView row className="mb-3 mt-3 justify-between">
          <AppText accessibilityRole="header" className="text-[18px] font-bold text-foreground">
            Past
          </AppText>
          <AppPressable
            onPress={() => Alert.alert('Filter trips', 'Filter and sort options')}
            hitSlop={10}
            accessibilityLabel="Filter trips"
          >
            <Icon name="slider.horizontal.3" size={18} />
          </AppPressable>
        </AppView>

        {ordersQuery.isPending ? null : past.length === 0 ? (
          <Card>
            <AppText className="text-[14px] text-muted">
              Completed and cancelled trips will show up here.
            </AppText>
          </Card>
        ) : (
          past.map((order, index) => (
            <AnimatedView key={order.id} entering={itemEntering(index + upcoming.length)}>
              <OrderCard order={order} showMapPreview={index === 0} onPress={openOrder} />
            </AnimatedView>
          ))
        )}
      </AppScrollView>
    </AppView>
  );
}
