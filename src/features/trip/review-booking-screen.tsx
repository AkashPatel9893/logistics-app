import { useEffect, useState } from 'react';

import {
  AnimatedView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  ScreenHeader,
} from '@/components/ui';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import { formatFare } from '@/lib/format';
import { enterFromBelow } from '@/lib/motion';
import { Alert } from '@/lib/native';
import { goBack, useRouter } from '@/lib/navigation';
import { requestPushPermission } from '@/lib/push';
import { useAppRules, useCreateOrder, useRideQuote } from '@/queries';
import { draftStops, useAuthStore, useTripStore, type TripDraft } from '@/stores';

import { DEFAULT_BOOKING_RULES, DEFAULT_RESTRICTED_ITEMS, pickNotice } from './booking-rules';
import { AddressDetailsSheet } from './components/address-details-sheet';
import { GoodsTypeSheet, type GoodsType } from './components/goods-type-sheet';
import { RestrictedItemsSheet } from './components/restricted-items-sheet';
import {
  ReviewFareCard,
  ReviewGoodsCard,
  ReviewOffersCard,
  ReviewRulesCard,
  ReviewVehicleCard,
} from './components/review-booking-cards';
import { saveLocalRecentAddress } from './hooks/use-address-search';

type Sheet = 'addresses' | 'goods' | 'restricted' | null;

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

export function ReviewBookingScreen() {
  const router = useRouter();
  const draft = useTripStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : [])),
    couponCode: draft.couponCode,
  });
  const createOrder = useCreateOrder();
  const appRules = useAppRules();
  const bookingRules = pickNotice(appRules.bookingRules, DEFAULT_BOOKING_RULES);
  const restrictedItems = pickNotice(appRules.restrictedItems, DEFAULT_RESTRICTED_ITEMS);
  const [goods, setGoods] = useState<GoodsType | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const closeSheet = () => setSheet(null);

  useEffect(() => () => useTripStore.getState().setCouponCode(null), []);

  const options = quote.data?.options ?? [];
  const selected = options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? null;
  const fallbackSender = user ? { name: user.name ?? '', phone: user.phone ?? '' } : null;

  const handleBook = () => {
    if (!selected || createOrder.isPending) return;
    if (!goods) {
      setSheet('goods');
      return;
    }
    createOrder.mutate(
      {
        pickup: {
          label: draft.pickupLabel,
          street: draft.pickupStreet,
          location: draft.pickupRegion,
          houseNumber: draft.pickupDetails?.houseNumber ?? '',
          contact: draft.pickupDetails
            ? { name: draft.pickupDetails.contactName, phone: draft.pickupDetails.contactPhone }
            : user?.name && user.phone
              ? { name: user.name, phone: user.phone }
              : null,
        },
        drop: {
          label: draft.dropLabel || 'Drop location',
          street: draft.dropStreet,
          location: draft.dropRegion,
          houseNumber: draft.dropDetails?.houseNumber ?? '',
          contact: draft.dropDetails
            ? { name: draft.dropDetails.contactName, phone: draft.dropDetails.contactPhone }
            : null,
        },
        stops: draft.midStops.map((stop) => ({
          label: stop.label || 'Stop',
          street: stop.street,
          location: stop.region,
          houseNumber: stop.details?.houseNumber ?? '',
          contact: stop.details
            ? { name: stop.details.contactName, phone: stop.details.contactPhone }
            : null,
        })),
        vehicleId: selected.vehicleId,
        quoteId: selected.quoteId,
        couponCode: selected.coupon?.valid ? draft.couponCode : null,
        goods: goods ? { category: goods.category, description: goods.label } : null,
      },
      {
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
      },
    );
  };

  const total = selected ? formatFare(selected.breakdown.total) : null;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Review Booking" onBack={() => goBack(router)} className="pb-3" />

      <AppScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-1">
        <AnimatedView entering={enterFromBelow(0)}>
          <ReviewVehicleCard
            selected={selected}
            draft={draft}
            onPressAddressDetails={() => setSheet('addresses')}
          />
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(2)}>
          <ReviewOffersCard
            couponCode={draft.couponCode}
            coupon={selected?.coupon ?? null}
            onPressOffers={() => router.push('/offers')}
            onRemoveCoupon={() => useTripStore.getState().setCouponCode(null)}
          />
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(3)}>
          <ReviewFareCard
            selected={selected}
            quoteData={quote.data}
            isError={quote.isError}
            error={quote.error}
            onChooseAnother={() => goBack(router)}
            onRetry={() => quote.refetch()}
          />
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(4)}>
          <ReviewGoodsCard
            goods={goods}
            onPressGoods={() => setSheet('goods')}
            onPressRestricted={() => setSheet('restricted')}
          />
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(5)}>
          <ReviewRulesCard rules={bookingRules} />
        </AnimatedView>
      </AppScrollView>

      <AppView className="rounded-t-[28px] bg-surface px-4 pb-safe-offset-3 pt-3.5 shadow-sheet">
        {total ? (
          <AppView row className="mb-3 items-end justify-between">
            <AppText className="text-[13px] font-medium text-muted">Total, incl. taxes</AppText>
            <AppText className="text-[20px] font-black tabular-nums text-foreground">
              {total}
            </AppText>
          </AppView>
        ) : null}
        <Button
          label={!goods ? 'Choose goods type' : selected ? `Book ${selected.name}` : 'Book now'}
          className="h-14"
          disabled={!selected}
          loading={createOrder.isPending}
          onPress={handleBook}
        />
      </AppView>

      <AddressDetailsSheet
        visible={sheet === 'addresses'}
        onClose={closeSheet}
        draft={draft}
        option={selected}
        fallbackSender={fallbackSender}
      />
      <RestrictedItemsSheet
        visible={sheet === 'restricted'}
        items={restrictedItems}
        onClose={closeSheet}
      />
      <GoodsTypeSheet
        visible={sheet === 'goods'}
        value={goods}
        onConfirm={setGoods}
        onClose={closeSheet}
      />
    </AppView>
  );
}
