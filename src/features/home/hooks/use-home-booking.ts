import type { DisplayAddress } from '@/features/trip/hooks/use-address-search';
import type { OfferBanner, VehicleType } from '@/lib/api/models';
import { useRouter } from '@/lib/navigation';
import { useTripStore } from '@/stores';

export function useHomeBooking() {
  const router = useRouter();

  const startBooking = (vehicleId?: string) => {
    const trip = useTripStore.getState();
    trip.resetDraft(false);
    if (vehicleId) trip.setSelectedVehicle(vehicleId);
    router.push('/location-select');
  };

  const selectRecentDrop = (drop: DisplayAddress) => {
    const trip = useTripStore.getState();
    trip.resetDraft(false);
    trip.setDrop(drop.name, drop.location, drop.address);
    router.push('/location-select');
  };

  const selectVehicle = (vehicle: VehicleType) => {
    startBooking(vehicle.id);
  };

  const openPickupSelector = () => {
    router.push({
      pathname: '/location-select',
      params: { target: 'pickup', from: 'home' },
    });
  };

  const selectOfferBanner = (banner: OfferBanner) => {
    if (banner.couponCode) {
      const trip = useTripStore.getState();
      trip.resetDraft(false);
      trip.setCouponCode(banner.couponCode);
      router.push('/location-select');
    } else {
      router.push('/offers');
    }
  };

  return {
    startBooking,
    selectRecentDrop,
    selectVehicle,
    openPickupSelector,
    selectOfferBanner,
  };
}
