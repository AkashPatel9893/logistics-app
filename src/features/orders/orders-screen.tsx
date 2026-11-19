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

import { useActiveRidesInset } from './components/active-rides-dock';
import { OrderCard, OrderCardSkeleton } from './components/order-card';
import { RebookButton } from './components/rebook-button';
import { useOrderHistoryRows } from './hooks/use-order-history-rows';
import { canRebook, useRebook } from './hooks/use-rebook';

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

function OrdersListFooter({
  isLoadError,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: {
  isLoadError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
}) {
  return (
    <>
      {isLoadError ? (
        <AppText className="py-3 text-muted">Could not load orders. Pull to retry.</AppText>
      ) : null}
      {hasNextPage ? (
        <AppPressable
          onPress={onLoadMore}
          disabled={isFetchingNextPage}
          className="min-h-11 items-center justify-center py-3"
        >
          <AppText className="font-bold text-brand">
            {isFetchingNextPage ? 'Loading…' : 'Load older orders'}
          </AppText>
        </AppPressable>
      ) : null}
      {isFetchNextPageError ? (
        <AppText className="text-center text-muted">
          Could not load older orders. Try again.
        </AppText>
      ) : null}
    </>
  );
}

export function OrdersScreen() {
  const router = useRouter();
  const tabBarInset = useFloatingTabBarInset();
  const activeRidesInset = useActiveRidesInset();
  const { rows, ordersQuery } = useOrderHistoryRows();
  const { rebook, rebookingId } = useRebook();

  const openOrder = (order: Order) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  return (
    <AppView className="flex-1 bg-background pt-safe">
      <FocusAwareStatusBar />
      <AppFlatList
        data={rows}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.kind}
        contentContainerClassName="px-5 pt-4"
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
          <OrdersListFooter
            isLoadError={ordersQuery.isError && !ordersQuery.data}
            hasNextPage={ordersQuery.hasNextPage}
            isFetchingNextPage={ordersQuery.isFetchingNextPage}
            isFetchNextPageError={ordersQuery.isFetchNextPageError}
            onLoadMore={() => void ordersQuery.fetchNextPage()}
          />
        }
      />
    </AppView>
  );
}
