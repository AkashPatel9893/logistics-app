import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  Card,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { PAYMENT_METHOD_ICON } from '@/features/wallet/payment-method-icon';
import { useRideQuote } from '@/hooks/use-catalog';
import { useCreateOrder } from '@/hooks/use-orders';
import { useDefaultPaymentMethod, useSetDefaultPaymentMethod, useWallet } from '@/hooks/use-wallet';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import type { PaymentTiming } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { enterFromBelow } from '@/lib/motion';
import { goBack } from '@/lib/go-back';
import { draftStops, useTripStore, type TripDraft } from '@/stores/trip-store';

import { BOOKING_NOTES } from '@/lib/booking-notes';
import { AddressDetailsSheet } from './components/address-details-sheet';
import { GoodsTypeSheet, type GoodsType } from './components/goods-type-sheet';
import { GstinSheet } from '@/components/gstin-sheet';
import { useGstinStore } from '@/stores/gstin-store';
import { PaymentMethodSheet } from './components/payment-method-sheet';
import { RestrictedItemsSheet } from './components/restricted-items-sheet';
import { formatFare } from '@/lib/format';
import { VehicleImage } from '@/components/vehicle-image';
import { saveLocalRecentAddress } from './hooks/use-address-search';

type Sheet = 'addresses' | 'goods' | 'restricted' | 'gstin' | 'payment' | null;

/** Adds every place of a placed booking to the recent addresses, last stop first. */
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

function CardTitle({ children }: { children: string }) {
  return (
    <AppText accessibilityRole="header" className="mb-1 text-[16px] font-bold text-foreground">
      {children}
    </AppText>
  );
}

/** Last booking step, like Porter's Review Booking: vehicle, GSTIN, offers, fare, goods, rules. */
export function ReviewBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();
  const wallet = useWallet();
  const paymentMethod = useDefaultPaymentMethod();
  const setDefaultPayment = useSetDefaultPaymentMethod();
  const gstin = useGstinStore((state) => state.gstin);
  const timing: PaymentTiming = 'on-delivery';
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : [])),
    couponCode: draft.couponCode,
  });
  const createOrder = useCreateOrder();
  const [goods, setGoods] = useState<GoodsType | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const setIsGoodsSheetOpen = (open: boolean) => setSheet(open ? 'goods' : null);
  const closeSheet = () => setSheet(null);

  // A coupon belongs to this vehicle's price: going back to change the vehicle drops it, since it
  // may not apply to another one. (Opening the offers screen keeps this screen, and the coupon.)
  useEffect(() => () => useTripStore.getState().setCouponCode(null), []);

  const options = quote.data?.options ?? [];
  // Exactly the vehicle chosen in the previous step: never swapped for another at a different price.
  const selected = options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? null;
  const fallbackSender = user ? { name: user.name ?? '', phone: user.phone ?? '' } : null;

  const handleBook = () => {
    if (!selected || !paymentMethod || createOrder.isPending) return;
    // Like Porter, the goods type is asked for before the booking can be placed.
    if (!goods) {
      setIsGoodsSheetOpen(true);
      return;
    }
    createOrder.mutate(
      {
        pickup: {
          label: draft.pickupLabel,
          street: draft.pickupStreet,
          location: draft.pickupRegion,
          houseNumber: draft.pickupDetails?.houseNumber ?? '',
          // The sender defaults to the signed-in user's own details, never a placeholder.
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
        // A coupon that doesn't apply to this vehicle is not part of its price.
        couponCode: selected.coupon?.valid ? draft.couponCode : null,
        paymentMethodId: paymentMethod.id,
        paymentTiming: timing,
        goods: goods ? { category: goods.category, description: goods.label } : null,
      },
      {
        onSuccess: (order) => {
          // Places become "recent" only once a booking with them is really placed.
          rememberTripPlaces(useTripStore.getState().draft);
          useTripStore.getState().setCouponCode(null);
          // Drop the booking screens from history so "back" from tracking goes home.
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
  const coupon = selected?.coupon ?? null;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Review Booking" onBack={() => goBack(router)} className="pb-3" />

      <AppScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-1">
        {/* Vehicle */}
        <AnimatedView entering={enterFromBelow(0)}>
          <Card variant="elevated" className="rounded-3xl p-3.5">
            <AppView row className="items-center">
              <AppView
                center
                className="mr-3 h-[64px] w-[76px] overflow-hidden rounded-2xl bg-brand-soft"
              >
                <VehicleImage
                  imageUrl={selected?.imageUrl}
                  style={{ width: 68, height: 54 }}
                  fallbackClassName="size-11 rounded-full bg-surface"
                  fallbackIconSize={20}
                  fallbackTone="brand"
                />
              </AppView>
              <AppView className="flex-1 pr-2">
                <AppText numberOfLines={1} className="text-[17px] font-bold text-foreground">
                  {selected?.name ?? 'Your vehicle'}
                </AppText>
                <AppPressable
                  onPress={() => setSheet('addresses')}
                  accessibilityRole="button"
                  hitSlop={6}
                  className="mt-1 flex-row items-center self-start"
                >
                  <AppText className="text-[13px] font-semibold text-brand-strong">
                    View address details
                  </AppText>
                  <Icon name="chevron.right" size={13} tone="brand" />
                </AppPressable>
              </AppView>
              {selected?.etaMinutes != null ? (
                <AppView center className="rounded-2xl bg-surface-muted px-3 py-1.5">
                  <AppText className="text-[18px] font-black leading-[22px] text-foreground">
                    {selected.etaMinutes}
                  </AppText>
                  <AppText className="text-[11px] font-semibold text-muted">mins</AppText>
                </AppView>
              ) : null}
            </AppView>
          </Card>
        </AnimatedView>

        {/* GSTIN */}
        <AnimatedView entering={enterFromBelow(1)}>
          <Card variant="elevated" className="rounded-3xl p-3.5">
            <AppView row className="items-center">
              <IconBadge
                name="wallet.pass.fill"
                tone="brand"
                iconSize={19}
                className="mr-3 size-11 rounded-2xl bg-brand-soft"
              />
              <AppView className="flex-1 pr-2">
                <AppText className="text-[15px] font-bold text-foreground">
                  {gstin ? 'GSTIN added' : 'Have a GST number?'}
                </AppText>
                <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                  {gstin ?? 'Claim Input Tax Credit on your trips'}
                </AppText>
              </AppView>
              <AppPressable
                onPress={() => setSheet('gstin')}
                accessibilityRole="button"
                accessibilityLabel={gstin ? 'Edit GSTIN' : 'Add GSTIN'}
                className="rounded-xl border border-brand px-3 py-2"
              >
                <AppText className="text-[13px] font-bold text-brand-strong">
                  {gstin ? 'Edit' : 'Add GSTIN'}
                </AppText>
              </AppPressable>
            </AppView>
          </Card>
        </AnimatedView>

        {/* Offers */}
        <AnimatedView entering={enterFromBelow(2)}>
          <Card variant="elevated" className="rounded-3xl">
            <CardTitle>Offers & discounts</CardTitle>
            <AppPressable
              onPress={() => router.push('/offers')}
              accessibilityRole="button"
              accessibilityLabel={
                draft.couponCode ? `Coupon ${draft.couponCode} applied. Change` : 'Apply coupon'
              }
              pressScale={0.98}
              className={cn(
                'mt-2 flex-row items-center rounded-2xl p-3',
                draft.couponCode ? 'bg-success/10' : 'bg-surface-muted',
              )}
            >
              <IconBadge
                name="percent"
                iconSize={17}
                tone={draft.couponCode ? 'success' : 'brand'}
                className="mr-3 rounded-xl bg-surface"
              />
              <AppView className="flex-1">
                <AppText className="text-[15px] font-bold text-foreground">
                  {draft.couponCode ? `${draft.couponCode} applied` : 'Apply coupon'}
                </AppText>
                {draft.couponCode && coupon ? (
                  <AppText
                    className={cn(
                      'mt-0.5 text-[12px]',
                      coupon.valid ? 'font-semibold text-success' : 'text-error',
                    )}
                  >
                    {coupon.valid ? `You save ₹${coupon.discount.toFixed(2)}` : coupon.reason}
                  </AppText>
                ) : !draft.couponCode ? (
                  <AppText className="mt-0.5 text-[12px] text-muted">
                    See offers for this trip
                  </AppText>
                ) : null}
              </AppView>
              {draft.couponCode ? (
                <AppPressable
                  onPress={() => useTripStore.getState().setCouponCode(null)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove coupon ${draft.couponCode}`}
                  hitSlop={8}
                >
                  <AppText className="text-[13px] font-bold text-muted">Remove</AppText>
                </AppPressable>
              ) : (
                <Icon name="chevron.right" size={15} tone="icon-subtle" />
              )}
            </AppPressable>
          </Card>
        </AnimatedView>

        {/* Fare */}
        <AnimatedView entering={enterFromBelow(3)}>
          <Card variant="elevated" className="rounded-3xl pt-3.5">
            <CardTitle>Fare</CardTitle>
            {selected ? (
              // Only the total, never the line-by-line breakdown (MOM, 10 November 2026).
              <AppView row className="mt-1 items-end justify-between">
                <AppView className="flex-1 pr-3">
                  <AppText className="text-[13px] text-muted">Total fare, incl. taxes</AppText>
                  {selected.breakdown.discount > 0 ? (
                    <AppText className="mt-0.5 text-[12px] font-semibold text-success">
                      Includes your {formatFare(selected.breakdown.discount)} coupon saving
                    </AppText>
                  ) : null}
                </AppView>
                <AppText className="text-[24px] font-black tabular-nums text-foreground">
                  {total}
                </AppText>
              </AppView>
            ) : quote.data ? (
              <AppView className="items-center py-4">
                <AppText className="text-center text-[13px] text-muted">
                  This vehicle is no longer available.
                </AppText>
                <Button
                  label="Choose another"
                  variant="ghost"
                  size="sm"
                  onPress={() => goBack(router)}
                />
              </AppView>
            ) : quote.isError ? (
              <AppView className="items-center py-4">
                <AppText className="text-center text-[13px] text-muted">
                  {getErrorMessage(quote.error)}
                </AppText>
                <Button
                  label="Try again"
                  variant="ghost"
                  size="sm"
                  onPress={() => quote.refetch()}
                />
              </AppView>
            ) : (
              <AppView row className="mt-1 items-end justify-between">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </AppView>
            )}
          </Card>
        </AnimatedView>

        {/* Goods */}
        <AnimatedView entering={enterFromBelow(4)}>
          <Card variant="elevated" className="overflow-hidden rounded-3xl p-0">
            <AppView className="p-4 pb-3.5">
              <CardTitle>Goods description</CardTitle>
              <AppPressable
                onPress={() => setSheet('goods')}
                accessibilityRole="button"
                accessibilityLabel={goods ? `Goods: ${goods.label}. Change` : 'Choose goods type'}
                pressScale={0.98}
                className={cn(
                  'mt-2 flex-row items-center rounded-2xl p-3',
                  goods
                    ? 'bg-surface-muted'
                    : 'border-2 border-dashed border-brand/40 bg-brand-soft',
                )}
              >
                <IconBadge
                  name={goods?.icon ?? 'shippingbox.fill'}
                  tone="brand"
                  className="mr-3 rounded-xl bg-surface"
                />
                <AppView className="flex-1">
                  <AppText className="text-[15px] font-bold text-foreground">
                    {goods?.label ?? 'Choose goods type'}
                  </AppText>
                  <AppText className="mt-0.5 text-[12px] text-muted">
                    {goods ? '1 package' : 'Needed before you book'}
                  </AppText>
                </AppView>
                <AppText className="text-[13px] font-bold text-brand-strong">
                  {goods ? 'Change' : 'Select'}
                </AppText>
              </AppPressable>
            </AppView>
            <AppPressable
              onPress={() => setSheet('restricted')}
              accessibilityRole="button"
              accessibilityLabel="Do not send restricted items. View list"
              className="flex-row items-center bg-amber-500/12 px-4 py-3"
            >
              <Icon name="lock.fill" size={14} tone="danger" />
              <AppText className="ml-2 flex-1 text-[13px] font-medium text-foreground">
                Do not send restricted items
              </AppText>
              <AppText className="mr-1 text-[13px] font-bold text-brand-strong">View list</AppText>
              <Icon name="chevron.right" size={13} tone="brand" />
            </AppPressable>
          </Card>
        </AnimatedView>

        {/* Rules */}
        <AnimatedView entering={enterFromBelow(5)}>
          <Card variant="elevated" className="rounded-3xl">
            <CardTitle>Read before booking</CardTitle>
            <AppView className="mt-1.5 gap-2">
              {BOOKING_NOTES.map((note) => (
                <AppView key={note} row className="items-start">
                  <AppView className="mr-2.5 mt-[7px] size-1.5 rounded-full bg-brand" />
                  <AppText className="flex-1 text-[13px] leading-[19px] text-foreground-secondary">
                    {note}
                  </AppText>
                </AppView>
              ))}
            </AppView>
          </Card>
        </AnimatedView>
      </AppScrollView>

      <AppView
        style={[styles.barShadow, { paddingBottom: insets.bottom + 12 }]}
        className="rounded-t-[28px] bg-surface px-4 pt-3.5"
      >
        <AppView row className="mb-3 items-center">
          {paymentMethod ? (
            <AppPressable
              onPress={() => setSheet('payment')}
              accessibilityRole="button"
              accessibilityLabel={`Payment method: ${paymentMethod.label}. Change`}
              className="flex-1 flex-row items-center"
            >
              <IconBadge
                name={PAYMENT_METHOD_ICON[paymentMethod.type]}
                tone="brand"
                iconSize={16}
                className="mr-2.5 size-9 rounded-xl bg-brand-soft"
              />
              <AppView className="flex-1">
                <AppText className="text-[11px] font-medium text-muted">Payment method</AppText>
                <AppView row className="items-center gap-1">
                  <AppText numberOfLines={1} className="text-[15px] font-bold text-foreground">
                    {paymentMethod.label}
                  </AppText>
                  <Icon name="chevron.down" size={13} tone="icon" />
                </AppView>
              </AppView>
            </AppPressable>
          ) : (
            <AppView row className="flex-1 items-center">
              <Skeleton className="mr-2.5 size-9 rounded-xl" />
              <AppView className="gap-1.5">
                <Skeleton className="h-2.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </AppView>
            </AppView>
          )}
          {total ? (
            <AppView className="items-end">
              <AppText className="text-[11px] font-medium text-muted">Total</AppText>
              <AppText className="text-[19px] font-black tabular-nums text-foreground">
                {total}
              </AppText>
            </AppView>
          ) : null}
        </AppView>
        <Button
          label={!goods ? 'Choose goods type' : selected ? `Book ${selected.name}` : 'Book now'}
          className="h-14"
          disabled={!selected || !paymentMethod}
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
      <GoodsTypeSheet
        visible={sheet === 'goods'}
        value={goods}
        onConfirm={setGoods}
        onClose={closeSheet}
      />
      <RestrictedItemsSheet visible={sheet === 'restricted'} onClose={closeSheet} />
      <GstinSheet visible={sheet === 'gstin'} onClose={closeSheet} />
      <PaymentMethodSheet
        visible={sheet === 'payment'}
        onClose={closeSheet}
        methods={wallet.data?.paymentMethods ?? []}
        selectedId={paymentMethod?.id ?? null}
        onSelect={(method) => setDefaultPayment.mutate(method.id)}
        onManage={() => router.push('/wallet')}
      />
    </AppView>
  );
}

const styles = StyleSheet.create({
  barShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 10,
  },
});
