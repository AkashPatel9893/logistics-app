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
import { formatFare } from '@/lib/format';
import { enterFromBelow } from '@/lib/motion';
import { goBack, useRouter } from '@/lib/navigation';
import { useAppRules, useRideQuote } from '@/queries';
import { useAuthStore, useTripStore } from '@/stores';

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
import { useBookOrder } from './hooks/use-book-order';

type Sheet = 'addresses' | 'goods' | 'restricted' | null;

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
  const { bookOrder, isBooking } = useBookOrder({
    selected,
    goods,
    onRequireGoods: () => setSheet('goods'),
  });

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
          loading={isBooking}
          onPress={bookOrder}
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
