import type { DisplayAddress } from '@/features/trip/hooks/use-address-search';
import type { VehicleType } from '@/lib/api/models';
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

  return {
    startBooking,
    selectRecentDrop,
    selectVehicle,
    openPickupSelector,
  };
}
