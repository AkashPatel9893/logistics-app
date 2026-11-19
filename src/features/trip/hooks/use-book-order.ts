import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import type { RideQuoteOption } from '@/lib/api/models';
import type { GeoPoint } from '@/lib/geo';
import { Alert } from '@/lib/native';
import { useRouter } from '@/lib/navigation';
import { requestPushPermission } from '@/lib/push';
import { useCreateOrder } from '@/queries';
import { draftStops, useAuthStore, useTripStore, type StopDetails, type TripDraft } from '@/stores';

import type { GoodsType } from '../components/goods-type-sheet';
import { saveLocalRecentAddress } from '../recent-addresses';

function rememberTripPlaces(draft: TripDraft): void {
  const places = [
    {
      label: draft.pickupLabel,
      address: draft.pickupAddress,
      region: draft.pickupRegion,
      usedAsDrop: false,
    },
    ...draftStops(draft).map((stop) => ({ ...stop, usedAsDrop: true })),
  ];
  places
    .filter((place) => place.label && place.region)
    .reverse()
    .forEach((place) =>
      saveLocalRecentAddress({
        id: `recent:${place.label}:${place.region?.latitude}:${place.region?.longitude}`,
        name: place.label,
        address: place.address,
        iconType: 'search',
        isFavorite: false,
        isSaved: false,
        location: place.region,
        usedAsDrop: place.usedAsDrop,
      }),
    );
}

function toOrderStop(
  label: string,
  street: string | undefined,
  location: GeoPoint | null,
  details: StopDetails | null,
  fallbackContact: { name: string; phone: string } | null = null,
) {
  return {
    label,
    street,
    location,
    houseNumber: details?.houseNumber ?? '',
    contact: details ? { name: details.contactName, phone: details.contactPhone } : fallbackContact,
  };
}

function buildOrderPayload(
  draft: TripDraft,
  fallbackSender: { name: string; phone: string } | null,
  selected: RideQuoteOption,
  goods: GoodsType,
) {
  return {
    pickup: toOrderStop(
      draft.pickupLabel,
      draft.pickupStreet,
      draft.pickupRegion,
      draft.pickupDetails,
      fallbackSender,
    ),
    drop: toOrderStop(
      draft.dropLabel || 'Drop location',
      draft.dropStreet,
      draft.dropRegion,
      draft.dropDetails,
    ),
    stops: draft.midStops.map((stop) =>
      toOrderStop(stop.label || 'Stop', stop.street, stop.region, stop.details),
    ),
    vehicleId: selected.vehicleId,
    quoteId: selected.quoteId,
    couponCode: selected.coupon?.valid ? draft.couponCode : null,
    goods: { category: goods.category, description: goods.label },
  };
}

export function useBookOrder({
  selected,
  goods,
  onRequireGoods,
}: {
  selected: RideQuoteOption | null;
  goods: GoodsType | null;
  onRequireGoods: () => void;
}) {
  const router = useRouter();
  const draft = useTripStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const createOrder = useCreateOrder();

  const fallbackContact = user?.name && user.phone ? { name: user.name, phone: user.phone } : null;

  const bookOrder = () => {
    if (!selected || createOrder.isPending) return;
    if (!goods) {
      onRequireGoods();
      return;
    }
    createOrder.mutate(buildOrderPayload(draft, fallbackContact, selected, goods), {
      onSuccess: (order) => {
        rememberTripPlaces(useTripStore.getState().draft);
        requestPushPermission();
        useTripStore.getState().setCouponCode(null);
        router.dismissAll();
        router.push({ pathname: '/order-tracking', params: { orderId: order.id } });
      },
      onError: (error) =>
        Alert.alert(
          'Could not place order',
          error instanceof ApiError ? error.message : getErrorMessage(error),
        ),
    });
  };

  return { bookOrder, isBooking: createOrder.isPending };
}
