import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StatusBar } from 'react-native';

import { AppScrollView, AppView } from '@/components/ui';
import { resolveOrderStage, useOrdersStore } from '@/stores/orders-store';
import { useTripStore } from '@/stores/trip-store';

import { ActiveOrderCard } from './components/active-order-card';
import { HomeHeaderBanner } from './components/home-header-banner';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import type { ActiveOrder, VehicleOption } from './types';

const STAGE_STATUS_LABEL: Record<string, string> = {
  searching: 'Finding driver',
  heading_to_pickup: 'Driver on the way',
  pickup_complete: 'Out for delivery',
};

export function HomeScreen() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [now, setNow] = useState(() => Date.now());

  const router = useRouter();
  const activeOrderId = useOrdersStore.use.activeOrderId();
  const orders = useOrdersStore.use.orders();

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(intervalId);
  }, []);

  const activeOrderRecord = activeOrderId ? orders[activeOrderId] : undefined;
  const activeOrder: ActiveOrder | undefined = activeOrderRecord
    ? {
        id: activeOrderRecord.id,
        orderNumber: `Order #${activeOrderRecord.id.slice(-6).toUpperCase()}`,
        status: STAGE_STATUS_LABEL[resolveOrderStage(activeOrderRecord, now)] ?? 'On the way',
        estimatedTime: `${activeOrderRecord.etaMinutes} min`,
      }
    : undefined;

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle.id);
    useTripStore.getState().resetDraft();
    useTripStore.getState().setSelectedVehicle(vehicle.id);
    router.push('/select-drop-address');
  };

  const handleSearchPress = () => {
    useTripStore.getState().resetDraft();
    router.push('/select-drop-address');
  };

  const handleMicPress = () => {
    Alert.alert('Voice Search', 'Listening for destination or pickup address...');
  };

  const handleOrderPress = (order: ActiveOrder) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  return (
    <AppView className="flex-1 bg-[#F9F8F5] dark:bg-neutral-950 relative">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Scrollable Content */}
      <AppScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
        {/* Top Header Banner & Search */}
        <HomeHeaderBanner onSearchPress={handleSearchPress} onMicPress={handleMicPress} />

        {/* Vehicle Selection Grid */}
        <VehicleSelectionGrid selectedId={selectedVehicle} onSelectVehicle={handleSelectVehicle} />

        {/* Active Order Tracking Card */}
        {activeOrder && <ActiveOrderCard order={activeOrder} onPressOrder={handleOrderPress} />}
      </AppScrollView>
    </AppView>
  );
}
