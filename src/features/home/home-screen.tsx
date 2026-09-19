import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StatusBar } from 'react-native';

import { AppScrollView, AppView } from '@/components/ui';

import { ActiveOrderCard } from './components/active-order-card';
import { HomeHeaderBanner } from './components/home-header-banner';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import { MOCK_ACTIVE_ORDER } from './mock-data';
import type { ActiveOrder, VehicleOption } from './types';

export function HomeScreen() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  const router = useRouter();

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle.id);
    router.push('/select-drop-address');
  };

  const handleSearchPress = () => {
    Alert.alert('Search Destination', 'Where would you like to deliver your goods?');
  };

  const handleMicPress = () => {
    Alert.alert('Voice Search', 'Listening for destination or pickup address...');
  };

  const handleOrderPress = (order: ActiveOrder) => {
    Alert.alert('Order Tracking', `Tracking ${order.orderNumber} - ${order.status}`);
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
        <ActiveOrderCard order={MOCK_ACTIVE_ORDER} onPressOrder={handleOrderPress} />
      </AppScrollView>
    </AppView>
  );
}
