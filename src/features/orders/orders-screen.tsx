import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import {
  AnimatedView,
  AppFlatList,
  AppPressable,
  AppRefreshControl,
  AppText,
  AppView,
  Card,
  FocusAwareStatusBar,
  Icon,
} from '@/components/ui';
import type { Order } from '@/lib/api/models';
import { enterFromBelow } from '@/lib/motion';
import { useRouter } from '@/lib/navigation';
import { isActiveOrder, useOrderHistory } from '@/queries';

import { useActiveRidesInset } from './components/active-rides-dock';
import { OrderCard, OrderCardSkeleton } from './components/order-card';
import { RebookButton } from './components/rebook-button';
import { canRebook, useRebook } from './hooks/use-rebook';

type OrderListRow =
  | { kind: 'section'; id: string; title: string; isPast?: boolean }
  | { kind: 'empty-upcoming'; id: string }
  | { kind: 'empty-past'; id: string }
  | { kind: 'skeleton'; id: string }
  | { kind: 'order'; id: string; order: Order; index: number; isPast: boolean };

function EmptyUpcoming({ onBook }: { onBook: () => void }) {
  return (
    <Card className="mb-6">
      <AppText className="text-[15px] font-bold text-foreground">No deliveries in progress</AppText>
      <AppPressable onPress={onBook} className="mt-1.5 flex-row items-center gap-1.5 self-start">
        <AppText className="text-[14px] font-semibold text-brand">Book a delivery</AppText>
        <Icon name="arrow.right" size={13} tone="brand" />
      </AppPressable>
    </Card>
  );
}

export function OrdersScreen() {
  const router = useRouter();
  const tabBarInset = useFloatingTabBarInset();
  const activeRidesInset = useActiveRidesInset();
  const ordersQuery = useOrderHistory();
  const { rebook, rebookingId } = useRebook();

  const orders = ordersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const upcoming = orders.filter(isActiveOrder);
  const past = orders.filter((order) => !isActiveOrder(order));

  const openOrder = (order: Order) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  const rows: OrderListRow[] = [];
  if (ordersQuery.isPending) {
    rows.push(
      { kind: 'skeleton', id: 'skeleton-0' },
      { kind: 'skeleton', id: 'skeleton-1' },
      { kind: 'skeleton', id: 'skeleton-2' },
    );
  } else {
    const hasLoadError = ordersQuery.isError && !ordersQuery.data;
    if (upcoming.length > 0 || past.length === 0) {
      rows.push({ kind: 'section', id: 'section-upcoming', title: 'In progress' });
    }
    if (!hasLoadError) {
      if (upcoming.length === 0) {
        if (past.length === 0) rows.push({ kind: 'empty-upcoming', id: 'empty-upcoming' });
      } else {
        upcoming.forEach((order, index) => {
          rows.push({ kind: 'order', id: order.id, order, index, isPast: false });
        });
      }
    }

    rows.push({ kind: 'section', id: 'section-past', title: 'Past', isPast: true });
    if (!hasLoadError) {
      if (past.length === 0) {
        rows.push({ kind: 'empty-past', id: 'empty-past' });
      } else {
        past.forEach((order, index) => {
          rows.push({
            kind: 'order',
            id: order.id,
            order,
            index: index + upcoming.length,
            isPast: true,
          });
        });
      }
    }
  }

  return (
    // Inset on the container (not the scroll view) so content and the refresh
    // spinner stay below the status bar.
    <AppView className="flex-1 bg-background pt-safe">
      <FocusAwareStatusBar />
      <AppFlatList
        data={rows}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.kind}
        contentContainerClassName="px-5 pt-4"
        // Scrolls behind the floating tab bar; the end stays clear of it.
        contentContainerStyle={{ paddingBottom: tabBarInset + 24 + activeRidesInset }}
        refreshControl={
          <AppRefreshControl
            refreshing={ordersQuery.isRefetching}
            onRefresh={() => {
              void ordersQuery.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <AppText
            accessibilityRole="header"
            className="mb-5 text-[32px] font-extrabold tracking-tight text-foreground"
          >
            Orders
          </AppText>
        }
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'section':
              return (
                <AppText
                  accessibilityRole="header"
                  className={
                    item.isPast
                      ? 'mb-3 mt-3 text-[18px] font-bold text-foreground'
                      : 'mb-3 text-[18px] font-bold text-foreground'
                  }
                >
                  {item.title}
                </AppText>
              );
            case 'skeleton':
              return <OrderCardSkeleton />;
            case 'empty-upcoming':
              return <EmptyUpcoming onBook={() => router.push('/home')} />;
            case 'empty-past':
              return (
                <Card>
                  <AppText className="text-[14px] text-muted">
                    Completed and cancelled trips will show up here.
                  </AppText>
                </Card>
              );
            case 'order':
              return (
                <AnimatedView
                  entering={enterFromBelow(item.index)}
                  className={!item.isPast ? 'mb-0' : undefined}
                >
                  <OrderCard
                    order={item.order}
                    onPress={openOrder}
                    action={
                      item.isPast && canRebook(item.order) ? (
                        <RebookButton
                          isBusy={rebookingId === item.order.id}
                          onPress={() => void rebook(item.order)}
                        />
                      ) : undefined
                    }
                  />
                </AnimatedView>
              );
          }
        }}
        ListFooterComponent={
          <>
            {ordersQuery.isError && !ordersQuery.data ? (
              <AppText className="py-3 text-muted">Could not load orders. Pull to retry.</AppText>
            ) : null}
            {ordersQuery.hasNextPage ? (
              <AppPressable
                onPress={() => void ordersQuery.fetchNextPage()}
                disabled={ordersQuery.isFetchingNextPage}
                className="min-h-11 items-center justify-center py-3"
              >
                <AppText className="font-bold text-brand">
                  {ordersQuery.isFetchingNextPage ? 'Loading…' : 'Load older orders'}
                </AppText>
              </AppPressable>
            ) : null}
            {ordersQuery.isFetchNextPageError ? (
              <AppText className="text-center text-muted">
                Could not load older orders. Try again.
              </AppText>
            ) : null}
          </>
        }
      />
    </AppView>
  );
}
