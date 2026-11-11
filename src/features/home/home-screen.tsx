import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  AppScrollView,
  AppView,
  FocusAwareStatusBar,
  StatusBarScrim,
  useStatusBarScrim,
} from '@/components/ui';
import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import { getCurrentPosition, reverseGeocodePlace } from '@/features/trip/geocoding';
import {
  loadLocalRecentAddresses,
  type DisplayAddress,
} from '@/features/trip/hooks/use-address-search';
import { useOfferBanners, useVehicleCatalog } from '@/hooks/use-catalog';
import type { VehicleType } from '@/lib/api/models';
import { useTripStore } from '@/stores/trip-store';
import {
  getLocationStatus,
  hasLocationAccess,
  requestLocationAccess,
  type LocationStatus,
} from '@/features/trip/location-access';

import { ActiveOrderCard } from './components/active-order-card';
import { HomeHeaderBanner } from './components/home-header-banner';
import { LocationOffBanner } from './components/location-off-banner';
import { OfferBannerCarousel } from './components/offer-banner-carousel';
import { RecentActivity } from './components/recent-activity';
import { VehicleSelectionGrid } from './components/vehicle-selection-grid';
import { useActiveOrder, type ActiveOrderSummary } from './hooks/use-active-order';

/** Home shows the system prompt once per app session; after that it only checks. */
let hasAskedForLocationOnHome = false;

/** Recent places offered on home; the full list lives on the address screen. */
const RECENT_DROPS_SHOWN = 2;

const AnimatedAppScrollView = Animated.createAnimatedComponent(AppScrollView);

export function HomeScreen() {
  const router = useRouter();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const activeOrder = useActiveOrder();
  const { data: catalog } = useVehicleCatalog();
  const { data: banners = [] } = useOfferBanners();
  const scrim = useStatusBarScrim();
  const tabBarInset = useFloatingTabBarInset();

  const draft = useTripStore((state) => state.draft);
  const [currentPlace, setCurrentPlace] = useState<{ label: string; address: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Coming back from Settings (location just allowed) retries the lookup.
  const [appActiveCount, setAppActiveCount] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAppActiveCount((count) => count + 1);
    });
    return () => sub.remove();
  }, []);

  // Automatically fetch current device location for the "Pick up from" card if no pickup is set yet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (draft.pickupLabel) return;
      setIsLocating(true);
      try {
        // No pickup yet: it defaults to where the customer is, so ask on first open. A refusal
        // stays quiet here (the card offers to set the address instead).
        let granted = await hasLocationAccess();
        if (!granted && !hasAskedForLocationOnHome) {
          hasAskedForLocationOnHome = true;
          // First time: say why before the system prompt, as large apps do.
          granted = (await requestLocationAccess({ prime: true })) === 'granted';
        }
        if (cancelled || !granted) return;
        const pos = await getCurrentPosition().catch(() => null);
        if (cancelled || !pos) return;
        const place = await reverseGeocodePlace(pos, 'Current location');
        if (cancelled) return;
        setCurrentPlace({ label: place.label, address: place.address });
        useTripStore.getState().setPickup(place.label, pos, place.address);
      } catch {
        // Fallback to default
      } finally {
        if (!cancelled) setIsLocating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft.pickupLabel, appActiveCount]);

  // Location state for the banner: re-read on open and whenever the app comes back (e.g. from
  // Settings, or after location was switched on from the quick settings panel).
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
    // Allowed now: fill the pickup from where the customer is.
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

  // Local recents change while this screen is in the background (after a booking), so re-read on focus.
  const [recentDrops, setRecentDrops] = useState<DisplayAddress[]>([]);
  useFocusEffect(
    useCallback(() => {
      setRecentDrops(
        loadLocalRecentAddresses()
          .filter((place) => place.location && place.usedAsDrop)
          .slice(0, RECENT_DROPS_SHOWN),
      );
    }, []),
  );

  const handleSelectRecentDrop = (drop: DisplayAddress) => {
    const trip = useTripStore.getState();
    const currentPickup = trip.draft.pickupRegion
      ? {
          label: trip.draft.pickupLabel,
          region: trip.draft.pickupRegion,
          address: trip.draft.pickupAddress,
          // Sender and house number entered from the pickup card carry into the booking.
          details: trip.draft.pickupDetails,
        }
      : null;
    trip.resetDraft();
    if (currentPickup) {
      trip.setPickup(currentPickup.label, currentPickup.region, currentPickup.address);
      if (currentPickup.details) trip.setPickupDetails(currentPickup.details);
    }
    trip.setDrop(drop.name, drop.location, drop.address);
    router.push('/location-select');
  };

  const startBooking = (vehicleId?: string) => {
    const trip = useTripStore.getState();
    const currentPickup = trip.draft.pickupRegion
      ? {
          label: trip.draft.pickupLabel,
          region: trip.draft.pickupRegion,
          address: trip.draft.pickupAddress,
          // Sender and house number entered from the pickup card carry into the booking.
          details: trip.draft.pickupDetails,
        }
      : null;
    trip.resetDraft();
    if (currentPickup) {
      trip.setPickup(currentPickup.label, currentPickup.region, currentPickup.address);
      if (currentPickup.details) trip.setPickupDetails(currentPickup.details);
    }
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
        // Scrolls behind the floating tab bar; the end stays clear of it (and the order card).
        contentContainerStyle={{ paddingBottom: tabBarInset + (activeOrder ? 80 : 24) }}
        onScroll={scrim.scrollHandler}
        scrollEventThrottle={16}
      >
        <HomeHeaderBanner
          pickupLabel={activePickupLabel}
          pickupAddress={activePickupAddress}
          isLoadingLocation={isLocating}
          // Like Porter: change only the pickup here, then come back to Home.
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
        <VehicleSelectionGrid
          catalog={catalog}
          selectedId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
        />
        <RecentActivity recentDrops={recentDrops} onSelectDrop={handleSelectRecentDrop} />
      </AnimatedAppScrollView>
      {/* Pinned above the tab bar: stays put while the page scrolls behind it. */}
      {activeOrder ? (
        <AppView className="absolute inset-x-0 z-20" style={{ bottom: tabBarInset }}>
          <ActiveOrderCard order={activeOrder} onPress={handleOpenOrder} />
        </AppView>
      ) : null}
      <StatusBarScrim scrollY={scrim.scrollY} fadeDistance={scrim.fadeDistance} />
    </AppView>
  );
}
