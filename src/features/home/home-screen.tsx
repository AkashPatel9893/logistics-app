import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  AppScrollView,
  AppView,
  FocusAwareStatusBar,
  StatusBarScrim,
  useStatusBarScrim,
} from '@/components/ui';
import { useOfferBanners, useVehicleCatalog } from '@/hooks/use-catalog';
import type { VehicleType } from '@/lib/api/models';
import { useTripStore } from '@/stores/trip-store';

import { ActiveOrderCard } from './components/active-order-card';
import { HomeHeaderBanner } from './components/home-header-banner';
import { OfferBannerCarousel } from './components/offer-banner-carousel';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import { useActiveOrder, type ActiveOrderSummary } from './hooks/use-active-order';

const AnimatedAppScrollView = Animated.createAnimatedComponent(AppScrollView);

export function HomeScreen() {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const activeOrder = useActiveOrder();
  const { data: catalog } = useVehicleCatalog();
  const { data: banners = [] } = useOfferBanners();
  const scrim = useStatusBarScrim();

  const startBooking = (vehicleId?: string) => {
    const trip = useTripStore.getState();
    trip.resetDraft();
    if (vehicleId) trip.setSelectedVehicle(vehicleId);
    router.push('/location-select');
  };

  const handleSelectVehicle = (vehicle: VehicleType) => {
    setSelectedVehicleId(vehicle.id);
    startBooking(vehicle.id);
  };

  const handleOpenOrder = (order: ActiveOrderSummary) => {
    router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
  };

  return (
    <AppView className="relative flex-1 bg-background">
      {/* Light icons read over both the orange banner and the dark scrim. */}
      <FocusAwareStatusBar style="light" />
      <AnimatedAppScrollView
        contentContainerClassName="pb-6"
        onScroll={scrim.scrollHandler}
        scrollEventThrottle={16}
      >
        <HomeHeaderBanner
          onSearchPress={() => startBooking()}
          onMicPress={() => Alert.alert('Voice search', 'Voice search is coming soon.')}
        />
        <OfferBannerCarousel banners={banners} />
        <VehicleSelectionGrid
          catalog={catalog}
          selectedId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
        />
        {activeOrder ? <ActiveOrderCard order={activeOrder} onPress={handleOpenOrder} /> : null}
      </AnimatedAppScrollView>
      <StatusBarScrim scrollY={scrim.scrollY} fadeDistance={scrim.fadeDistance} />
    </AppView>
  );
}
