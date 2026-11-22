import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import {
  AppScrollView,
  AppView,
  FocusAwareStatusBar,
  StatusBarScrim,
  useStatusBarScrim,
} from '@/components/ui';
import { useActiveRidesInset } from '@/features/orders/components/active-rides-dock';
import { Animated } from '@/lib/motion';
import { useOfferBanners, useVehicleCatalog } from '@/queries';

import { HomeFooter } from './components/home-footer';
import { HomeHeaderBanner } from './components/home-header-banner';
import { LocationOffBanner } from './components/location-off-banner';
import { OfferBannerCarousel } from './components/offer-banner-carousel';
import { RecentActivity } from './components/recent-activity';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import { useHomeBooking } from './hooks/use-home-booking';
import { useHomeLocation } from './hooks/use-home-location';
import { useLocationStatus } from './hooks/use-location-status';
import { useRecentDrops } from './hooks/use-recent-drops';

const AnimatedAppScrollView = Animated.createAnimatedComponent(AppScrollView);

export function HomeScreen() {
  const activeRidesInset = useActiveRidesInset();
  const tabBarInset = useFloatingTabBarInset();
  const scrim = useStatusBarScrim();
  const { data: catalog } = useVehicleCatalog();
  const { data: banners = [] } = useOfferBanners();
  const { pickupLabel, pickupAddress, isLocating, refreshLocation } = useHomeLocation();
  const { locationIssue, fixLocation } = useLocationStatus(isLocating);
  const { recentDrops } = useRecentDrops();
  const { startBooking, selectRecentDrop, selectVehicle, openPickupSelector, selectOfferBanner } =
    useHomeBooking();

  return (
    <AppView className="relative flex-1 bg-background">
      <FocusAwareStatusBar style="light" />
      <AnimatedAppScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset + 16 + activeRidesInset }}
        onScroll={scrim.scrollHandler}
        scrollEventThrottle={16}
      >
        <HomeHeaderBanner
          pickupLabel={pickupLabel}
          pickupAddress={pickupAddress}
          isLoadingLocation={isLocating}
          onPress={openPickupSelector}
          onPressDrop={() => startBooking()}
        />
        {locationIssue ? (
          <LocationOffBanner reason={locationIssue} onPress={() => fixLocation(refreshLocation)} />
        ) : null}
        <OfferBannerCarousel banners={banners} onSelectBanner={selectOfferBanner} />
        <VehicleSelectionGrid catalog={catalog} onSelectVehicle={selectVehicle} />
        <RecentActivity
          recentDrops={recentDrops}
          onSelectDrop={selectRecentDrop}
          scrollY={scrim.scrollY}
        />
        <HomeFooter />
      </AnimatedAppScrollView>
      <StatusBarScrim scrollY={scrim.scrollY} fadeDistance={scrim.fadeDistance} />
    </AppView>
  );
}
