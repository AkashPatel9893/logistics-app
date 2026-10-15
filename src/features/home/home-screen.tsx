import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import Animated from 'react-native-reanimated';

import {
  AppScrollView,
  AppView,
  FocusAwareStatusBar,
  StatusBarScrim,
  useStatusBarScrim,
} from '@/components/ui';
import {
  loadLocalRecentAddresses,
  type DisplayAddress,
} from '@/features/trip/hooks/use-address-search';
import { useOfferBanners, useVehicleCatalog } from '@/hooks/use-catalog';
import { isActiveOrder, useOrders } from '@/hooks/use-orders';
import type { VehicleType } from '@/lib/api/models';
import { useTripStore } from '@/stores/trip-store';

import { ActiveOrderCard } from './components/active-order-card';
import { HomeHeaderBanner } from './components/home-header-banner';
import { RecentActivity } from './components/recent-activity';
import { OfferBannerCarousel } from './components/offer-banner-carousel';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import { useActiveOrder, type ActiveOrderSummary } from './hooks/use-active-order';

/** Recent places offered on home; the full list lives on the address screen. */
const RECENT_DROPS_SHOWN = 2;

const AnimatedAppScrollView = Animated.createAnimatedComponent(AppScrollView);

export function HomeScreen() {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const activeOrder = useActiveOrder();
  const { data: catalog } = useVehicleCatalog();
  const { data: banners = [] } = useOfferBanners();
  const { data: orders } = useOrders();
  const scrim = useStatusBarScrim();

  // Local recents change while this screen is in the background (after a booking), so re-read on focus.
  const [recentDrops, setRecentDrops] = useState<DisplayAddress[]>([]);
  useFocusEffect(
    useCallback(() => {
      setRecentDrops(
        loadLocalRecentAddresses()
          .filter((place) => place.location)
          .slice(0, RECENT_DROPS_SHOWN),
      );
    }, []),
  );
  const lastOrder = orders?.find((order) => !isActiveOrder(order));

  const handleSelectRecentDrop = (drop: DisplayAddress) => {
    const trip = useTripStore.getState();
    trip.resetDraft();
    trip.setDrop(drop.name, drop.location, drop.address);
    // Opens the address screen with this place already searched; one tap confirms it.
    router.push('/location-select');
  };

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
        <HomeHeaderBanner onSearchPress={() => startBooking()} />
        <OfferBannerCarousel banners={banners} />
        <VehicleSelectionGrid
          catalog={catalog}
          selectedId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
        />
        <RecentActivity
          recentDrops={recentDrops}
          lastOrder={lastOrder}
          onSelectDrop={handleSelectRecentDrop}
          onViewAllOrders={() => router.navigate('/orders')}
          onOpenOrder={(order) =>
            router.push({ pathname: '/order-tracking', params: { orderId: order.id } })
          }
        />
      </AnimatedAppScrollView>
      {/* Pinned above the tab bar: stays put while the page scrolls behind it. */}
      {activeOrder ? <ActiveOrderCard order={activeOrder} onPress={handleOpenOrder} /> : null}
      <StatusBarScrim scrollY={scrim.scrollY} fadeDistance={scrim.fadeDistance} />
    </AppView>
  );
}
