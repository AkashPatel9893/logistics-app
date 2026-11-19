import { useEffect, useState } from 'react';

import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import {
  AppScrollView,
  AppView,
  FocusAwareStatusBar,
  StatusBarScrim,
  useStatusBarScrim,
} from '@/components/ui';
import { useActiveRidesInset } from '@/features/orders/components/active-rides-dock';
import { getCurrentPosition, reverseGeocodePlace } from '@/features/trip/geocoding';
import { useRecentDrops, type DisplayAddress } from '@/features/trip/hooks/use-address-search';
import {
  getLocationStatus,
  hasLocationAccess,
  requestLocationAccess,
  type LocationStatus,
} from '@/features/trip/location-access';
import { useOnAppForeground } from '@/hooks/use-app-state';
import type { VehicleType } from '@/lib/api/models';
import { Animated } from '@/lib/motion';
import { useRouter } from '@/lib/navigation';
import { useOfferBanners, useVehicleCatalog } from '@/queries';
import { useTripStore } from '@/stores';

import { HomeHeaderBanner } from './components/home-header-banner';
import { LocationOffBanner } from './components/location-off-banner';
import { OfferBannerCarousel } from './components/offer-banner-carousel';
import { RecentActivity } from './components/recent-activity';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';

let hasAskedForLocationOnHome = false;

const RECENT_DROPS_SHOWN = 2;

const AnimatedAppScrollView = Animated.createAnimatedComponent(AppScrollView);

export function HomeScreen() {
  const router = useRouter();
  const activeRidesInset = useActiveRidesInset();
  const { data: catalog } = useVehicleCatalog();
  const { data: banners = [] } = useOfferBanners();
  const scrim = useStatusBarScrim();
  const tabBarInset = useFloatingTabBarInset();

  const draft = useTripStore((state) => state.draft);
  const [currentPlace, setCurrentPlace] = useState<{ label: string; address: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [appActiveCount, setAppActiveCount] = useState(0);
  useOnAppForeground(() => setAppActiveCount((count) => count + 1));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (draft.pickupLabel) return;
      setIsLocating(true);
      try {
        let granted = await hasLocationAccess();
        if (!granted && !hasAskedForLocationOnHome) {
          hasAskedForLocationOnHome = true;
          granted = (await requestLocationAccess()) === 'granted';
        }
        if (cancelled || !granted) return;
        const pos = await getCurrentPosition().catch(() => null);
        if (cancelled || !pos) return;
        const place = await reverseGeocodePlace(pos, 'Current location');
        if (cancelled) return;
        setCurrentPlace({ label: place.label, address: place.address });
        useTripStore.getState().setPickup(place.label, pos, place.address);
      } catch {
        // Silent failure: user can pick pickup manually.
      } finally {
        if (!cancelled) setIsLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.pickupLabel, appActiveCount]);

  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    getLocationStatus().then((status) => {
      if (!cancelled) setLocationStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [appActiveCount]);
  const handleFixLocation = async () => {
    const access = await requestLocationAccess({ explain: true });
    setLocationStatus(await getLocationStatus());
    if (access === 'granted') setAppActiveCount((count) => count + 1);
  };
  const locationIssue: 'services-off' | 'permission' | null =
    locationStatus === 'services-off'
      ? 'services-off'
      : locationStatus === 'blocked' ||
          (locationStatus === 'not-asked' && hasAskedForLocationOnHome)
        ? 'permission'
        : null;

  const activePickupLabel = draft.pickupLabel || currentPlace?.label;
  const activePickupAddress = draft.pickupAddress || currentPlace?.address;

  const recentDrops = useRecentDrops(RECENT_DROPS_SHOWN);

  const handleSelectRecentDrop = (drop: DisplayAddress) => {
    const trip = useTripStore.getState();
    trip.resetDraft(false);
    trip.setDrop(drop.name, drop.location, drop.address);
    router.push('/location-select');
  };

  const startBooking = (vehicleId?: string) => {
    const trip = useTripStore.getState();
    trip.resetDraft(false);
    if (vehicleId) trip.setSelectedVehicle(vehicleId);
    router.push('/location-select');
  };

  const handleSelectVehicle = (vehicle: VehicleType) => {
    startBooking(vehicle.id);
  };

  return (
    <AppView className="relative flex-1 bg-background">
      <FocusAwareStatusBar style="light" />
      <AnimatedAppScrollView
        contentContainerStyle={{ paddingBottom: tabBarInset + 24 + activeRidesInset }}
        onScroll={scrim.scrollHandler}
        scrollEventThrottle={16}
      >
        <HomeHeaderBanner
          pickupLabel={activePickupLabel}
          pickupAddress={activePickupAddress}
          isLoadingLocation={isLocating}
          onPress={() =>
            router.push({
              pathname: '/location-select',
              params: { target: 'pickup', from: 'home' },
            })
          }
          onPressDrop={() => startBooking()}
        />
        {locationIssue ? (
          <LocationOffBanner reason={locationIssue} onPress={handleFixLocation} />
        ) : null}
        <OfferBannerCarousel banners={banners} />
        <VehicleSelectionGrid catalog={catalog} onSelectVehicle={handleSelectVehicle} />
        <RecentActivity
          recentDrops={recentDrops}
          onSelectDrop={handleSelectRecentDrop}
          scrollY={scrim.scrollY}
        />
      </AnimatedAppScrollView>
      <StatusBarScrim scrollY={scrim.scrollY} fadeDistance={scrim.fadeDistance} />
    </AppView>
  );
}
