import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Image as RNImage, Platform, StatusBar } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppScrollView, AppText, AppView, Card } from '@/components/ui';
import { getRideOptionById } from '@/features/home/vehicle-catalog';
import { cn } from '@/lib/cn';
import {
  isOrderActive,
  resolveOrderStage,
  useOrdersStore,
  type OrderRecord,
  type OrderStage,
} from '@/stores/orders-store';

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROUTE_PREVIEW_REGION = {
  latitude: 28.6335,
  longitude: 77.243,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const STAGE_LABEL: Record<OrderStage, string> = {
  searching: 'Finding driver',
  heading_to_pickup: 'Driver on the way',
  pickup_complete: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderStatusText({ stage }: { stage: OrderStage }) {
  const isNegative = stage === 'cancelled';
  const isActive = stage !== 'delivered' && stage !== 'cancelled';

  return (
    <AppText
      className={cn(
        'text-[13px] font-semibold',
        isNegative || isActive ? 'text-[#FF5500]' : 'text-neutral-900 dark:text-neutral-100',
      )}
    >
      {STAGE_LABEL[stage]}
    </AppText>
  );
}

function formatDateLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OrderCard({
  order,
  stage,
  showMapPreview,
  onPress,
}: {
  order: OrderRecord;
  stage: OrderStage;
  showMapPreview: boolean;
  onPress: () => void;
}) {
  const vehicleImage = getRideOptionById(order.vehicleId)?.image;

  return (
    <AppPressable onPress={onPress} className="mb-3">
      <Card variant="default" className="p-0 overflow-hidden">
        {showMapPreview && (
          <AppView className="h-32 w-full">
            <MapView
              style={{ flex: 1 }}
              initialRegion={ROUTE_PREVIEW_REGION}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
            />
          </AppView>
        )}

        <AppView className="p-4 flex-row items-center">
          {vehicleImage && (
            <AppView className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center overflow-hidden mr-3">
              <RNImage
                source={vehicleImage}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </AppView>
          )}

          <AppView className="flex-1">
            <AppText
              className="text-[16px] font-bold text-neutral-900 dark:text-neutral-100"
              numberOfLines={1}
            >
              {order.dropLabel}
            </AppText>
            <AppText className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              {formatDateLabel(order.createdAt)}
            </AppText>
            <AppView className="flex-row items-center gap-1 mt-1.5">
              <AppText className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                ₹{order.price.toFixed(2)}
              </AppText>
              <AppText className="text-[13px] text-neutral-400"> · </AppText>
              <OrderStatusText stage={stage} />
            </AppView>
          </AppView>
        </AppView>
      </Card>
    </AppPressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const orders = useOrdersStore.use.orders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(intervalId);
  }, []);

  const allOrders = Object.values(orders).sort((a, b) => b.createdAt - a.createdAt);
  const upcomingOrders = allOrders.filter((order) => isOrderActive(order, now));
  const pastOrders = allOrders.filter((order) => !isOrderActive(order, now));

  const handleOrderPress = (order: OrderRecord) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  return (
    <AppView className="flex-1 bg-[#F9F8F5] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-36"
        style={{ paddingTop: insets.top + 16 }}
      >
        <AppText className="text-[32px] font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mb-5">
          Orders
        </AppText>

        {/* Upcoming */}
        <AppText className="text-[18px] font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Upcoming
        </AppText>
        {upcomingOrders.length === 0 ? (
          <Card variant="default" className="mb-6">
            <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              You have no upcoming trips
            </AppText>
            <AppPressable onPress={() => router.push('/home')} className="mt-1.5 self-start">
              <AppView className="flex-row items-center gap-1.5">
                <AppText className="text-[14px] font-semibold text-[#FF5500]">
                  Reserve your trip
                </AppText>
                {Platform.OS === 'ios' ? (
                  <SymbolView name="arrow.right" size={13} tintColor="#FF5500" />
                ) : (
                  <AppText className="text-[14px] font-semibold text-[#FF5500]">→</AppText>
                )}
              </AppView>
            </AppPressable>
          </Card>
        ) : (
          <AppView className="mb-3">
            {upcomingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                stage={resolveOrderStage(order, now)}
                showMapPreview={false}
                onPress={() => handleOrderPress(order)}
              />
            ))}
          </AppView>
        )}

        {/* Past */}
        <AppView className="flex-row items-center justify-between mb-3 mt-3">
          <AppText className="text-[18px] font-bold text-neutral-900 dark:text-neutral-100">
            Past
          </AppText>
          <AppPressable
            onPress={() => Alert.alert('Filter trips', 'Filter and sort options')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name="slider.horizontal.3" size={18} tintColor="#171717" />
            ) : (
              <AppText style={{ fontSize: 16 }}>⚙️</AppText>
            )}
          </AppPressable>
        </AppView>

        {pastOrders.length === 0 ? (
          <Card variant="default">
            <AppText className="text-[14px] text-neutral-500 dark:text-neutral-400">
              Completed and cancelled trips will show up here.
            </AppText>
          </Card>
        ) : (
          pastOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              stage={resolveOrderStage(order, now)}
              showMapPreview={index === 0}
              onPress={() => handleOrderPress(order)}
            />
          ))
        )}
      </AppScrollView>
    </AppView>
  );
}
