import { useEffect, useState } from 'react';

import { useAppRules, useRideQuote } from '@/queries';
import { useAuthStore, useTripStore } from '@/stores';

export function useVehicleOptionsQuote() {
  const draft = useTripStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const maxDrops = useAppRules().maxOrderStops - 1;
  const midRegions = draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : []));
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: midRegions,
    couponCode: draft.couponCode,
  });

  useEffect(() => {
    if (useTripStore.getState().draft.couponCode) useTripStore.getState().setCouponCode(null);
  }, []);

  const [arrivalVehicleId] = useState(draft.selectedVehicleId);
  const options = [...(quote.data?.options ?? [])].sort(
    (a, b) => Number(b.vehicleId === arrivalVehicleId) - Number(a.vehicleId === arrivalVehicleId),
  );
  const selected =
    options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? options[0] ?? null;

  const fallbackSender = user ? { name: user.name ?? '', phone: user.phone ?? '' } : null;

  const swapLocations = () => {
    const trip = useTripStore.getState();
    if (!trip.draft.pickupDetails && fallbackSender) {
      trip.setPickupDetails({
        contactName: fallbackSender.name,
        contactPhone: fallbackSender.phone,
        houseNumber: '',
      });
    }
    trip.swapPickupAndDrop();
  };

  const selectVehicle = (vehicleId: string) => {
    useTripStore.getState().setSelectedVehicle(vehicleId);
  };

  const availabilityLabel =
    quote.data?.distanceKm != null
      ? `${quote.data.distanceKm.toFixed(1)} km · ${options.length} available`
      : `${options.length} available`;

  return {
    draft,
    maxDrops,
    quote,
    options,
    selected,
    fallbackSender,
    availabilityLabel,
    swapLocations,
    selectVehicle,
  };
}
