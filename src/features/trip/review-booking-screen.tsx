import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { PAYMENT_METHOD_ICON } from '@/features/wallet/payment-method-icon';
import { useRideQuote, useValidateCoupon } from '@/hooks/use-catalog';
import { useCreateOrder } from '@/hooks/use-orders';
import { useScrollToEndOnKeyboard } from '@/hooks/use-scroll-to-end-on-keyboard';
import { useDefaultPaymentMethod } from '@/hooks/use-wallet';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import type { PaymentTiming, RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { goBack } from '@/lib/go-back';
import { draftStops, useTripStore, type TripDraft } from '@/stores/trip-store';

import { CouponField } from './components/coupon-field';
import { GoodsTypeSheet, type GoodsType } from './components/goods-type-sheet';
import { formatFare } from './components/ride-option-row';
import { VehicleImage } from './components/vehicle-image';
import { RouteSummary } from './components/route-summary';
import { saveLocalRecentAddress } from './hooks/use-address-search';

const rupees = (value: number) => `₹${value.toFixed(2)}`;
const NON_CHARGE_LINES = new Set(['DISCOUNT', 'TAX']);

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

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText
      accessibilityRole="header"
      className="mb-2.5 ml-1 mt-6 text-[15px] font-bold text-foreground"
    >
      {children}
    </AppText>
  );
}

function FareLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <AppView row className="mt-2 justify-between">
      <AppText className={cn('text-[14px]', strong ? 'font-bold text-foreground' : 'text-muted')}>
        {label}
      </AppText>
      <AppText className={cn('text-[14px]', strong ? 'font-bold text-brand' : 'text-foreground')}>
        {value}
      </AppText>
    </AppView>
  );
}

const fareLines = (breakdown: RideQuoteOption['breakdown'], includes: (type: string) => boolean) =>
  breakdown.lines
    .filter((line) => includes(line.type) && line.amount !== 0)
    .map((line) => <FareLine key={line.type} label={line.label} value={rupees(line.amount)} />);

/** Second booking step: how to pay, coupon and the fare, so the vehicle step can stay mostly map. */
export function ReviewBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Typing a coupon keeps the field and the fare it changes in view above the keyboard.
  const scrollRef = useScrollToEndOnKeyboard();
  const draft = useTripStore.use.draft();
  const user = useAuthStore.use.user();
  const paymentMethod = useDefaultPaymentMethod();
  const timing: PaymentTiming = 'on-delivery';
  const quote = useRideQuote({
    pickup: draft.pickupRegion,
    drop: draft.dropRegion,
    via: draft.midStops.flatMap((stop) => (stop.region ? [stop.region] : [])),
    couponCode: draft.couponCode,
  });
  const validateCoupon = useValidateCoupon();
  const createOrder = useCreateOrder();
  const [goods, setGoods] = useState<GoodsType | null>(null);
  const [isGoodsSheetOpen, setIsGoodsSheetOpen] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  // "View breakup" in the bottom bar scrolls up to the fare card.
  const fareY = useRef(0);

  const options = quote.data?.options ?? [];
  // Exactly the vehicle chosen in the previous step: never swapped for another at a different price.
  const selected = options.find((o) => o.vehicleId === draft.selectedVehicleId) ?? null;

  const handleApplyCoupon = async (code: string): Promise<string | null> => {
    try {
      const coupon = await validateCoupon.mutateAsync(code);
      useTripStore.getState().setCouponCode(coupon.code);
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

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

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      {/* Same warm wash as the vehicle step, so the two read as one flow. */}
      <AppView className="absolute inset-x-0 top-0 h-56 bg-brand-soft" />
      <AppView className="absolute -right-20 -top-10 size-64 rounded-full bg-brand/[0.06]" />
      <ScreenHeader title="Review Booking" onBack={() => goBack(router)} className="pb-3" />
      <AppKeyboardAvoidingView>
        <AppScrollView ref={scrollRef} contentContainerClassName="px-4 pb-6 pt-1">
          {/* Vehicle and trip */}
          <AppView className="rounded-[26px] bg-surface p-3.5" style={styles.cardShadow}>
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
                  onPress={() => setShowAddresses((value) => !value)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showAddresses }}
                  hitSlop={6}
                  className="mt-1 flex-row items-center self-start"
                >
                  <AppText className="text-[13px] font-semibold text-brand-strong">
                    {showAddresses ? 'Hide address details' : 'View address details'}
                  </AppText>
                  <Icon
                    name={showAddresses ? 'chevron.up' : 'chevron.down'}
                    size={13}
                    tone="brand"
                  />
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
            {showAddresses ? (
              <AppView className="-mx-3.5 mt-3 border-t border-divider pt-3">
                <RouteSummary draft={draft} />
              </AppView>
            ) : null}
          </AppView>

          {/* Goods */}
          <SectionTitle>What are you sending?</SectionTitle>
          <AppPressable
            onPress={() => setIsGoodsSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={goods ? `Goods: ${goods.label}. Change` : 'Choose goods type'}
            pressScale={0.98}
            className={cn(
              'flex-row items-center rounded-[22px] p-3.5',
              goods ? 'bg-surface' : 'border-2 border-dashed border-brand/40 bg-brand-soft',
            )}
            style={goods ? styles.cardShadow : undefined}
          >
            <AppView
              center
              className={cn('mr-3 size-11 rounded-2xl', goods ? 'bg-brand-soft' : 'bg-surface')}
            >
              <Icon name={goods?.icon ?? 'shippingbox.fill'} size={20} tone="brand" />
            </AppView>
            <AppView className="flex-1">
              <AppText className="text-[15px] font-bold text-foreground">
                {goods?.label ?? 'Choose goods type'}
              </AppText>
              <AppText className="mt-0.5 text-[12px] text-muted">
                {goods ? 'Tap to change' : 'Needed before you book'}
              </AppText>
            </AppView>
            <AppText className="text-[13px] font-bold text-brand-strong">
              {goods ? 'Change' : 'Select'}
            </AppText>
          </AppPressable>
          <AppView row className="mt-2 items-center px-1">
            <Icon name="lock.fill" size={12} tone="icon-subtle" />
            <AppText className="ml-1.5 flex-1 text-[11.5px] text-muted">
              Don&apos;t send drugs, weapons, explosives or flammable items.
            </AppText>
          </AppView>

          {/* Fare */}
          <AppView onLayout={(event) => (fareY.current = event.nativeEvent.layout.y)}>
            <SectionTitle>Fare summary</SectionTitle>
          </AppView>
          {selected ? (
            <AppView className="rounded-[22px] bg-surface p-4" style={styles.cardShadow}>
              {fareLines(selected.breakdown, (type) => !NON_CHARGE_LINES.has(type))}
              {selected.breakdown.discount > 0 ? (
                <FareLine
                  label="Coupon discount"
                  value={`− ${rupees(selected.breakdown.discount)}`}
                />
              ) : null}
              {/* Tax last: it's worked out on the fare after the discount. */}
              {fareLines(selected.breakdown, (type) => type === 'TAX')}
              <AppView
                row
                className="mt-3 items-center justify-between border-t border-dashed border-border pt-3"
              >
                <AppText className="text-[15px] font-bold text-foreground">Amount payable</AppText>
                <AppText className="text-[18px] font-black tabular-nums text-foreground">
                  {total}
                </AppText>
              </AppView>
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
              <Button label="Try again" variant="ghost" size="sm" onPress={() => quote.refetch()} />
            </AppView>
          ) : (
            <AppView className="py-6">
              <AppSpinner tone="brand" />
            </AppView>
          )}

          {/* Last, so typing a code keeps it above the keyboard. */}
          <SectionTitle>Offers & discounts</SectionTitle>
          <CouponField
            appliedCode={draft.couponCode}
            check={selected?.coupon ?? null}
            onApply={handleApplyCoupon}
            onRemove={() => useTripStore.getState().setCouponCode(null)}
          />
        </AppScrollView>

        <AppView
          style={[styles.barShadow, { paddingBottom: insets.bottom + 12 }]}
          className="rounded-t-[28px] bg-surface px-4 pt-3.5"
        >
          <AppView row className="mb-3 items-center">
            {paymentMethod ? (
              <AppPressable
                onPress={() => router.push('/wallet')}
                accessibilityRole="button"
                accessibilityLabel={`Payment method: ${paymentMethod.label}. Change`}
                className="flex-1 flex-row items-center"
              >
                <AppView center className="mr-2.5 size-9 rounded-xl bg-brand-soft">
                  <Icon name={PAYMENT_METHOD_ICON[paymentMethod.type]} size={16} tone="brand" />
                </AppView>
                <AppView className="flex-1">
                  <AppText className="text-[11px] font-medium text-muted">Pay at delivery</AppText>
                  <AppView row className="items-center gap-1">
                    <AppText numberOfLines={1} className="text-[15px] font-bold text-foreground">
                      {paymentMethod.label}
                    </AppText>
                    <Icon name="chevron.down" size={13} tone="icon" />
                  </AppView>
                </AppView>
              </AppPressable>
            ) : (
              <AppView className="flex-1 items-start">
                <AppSpinner />
              </AppView>
            )}
            {total ? (
              <AppPressable
                onPress={() => scrollRef.current?.scrollTo({ y: fareY.current, animated: true })}
                accessibilityRole="button"
                accessibilityLabel={`Total ${total}. View fare breakup`}
                className="items-end"
              >
                <AppText className="text-[19px] font-black tabular-nums text-foreground">
                  {total}
                </AppText>
                <AppText className="text-[12px] font-semibold text-brand-strong">
                  View breakup
                </AppText>
              </AppPressable>
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
      </AppKeyboardAvoidingView>

      <GoodsTypeSheet
        isPresented={isGoodsSheetOpen}
        selected={goods}
        onSelect={setGoods}
        onDismiss={() => setIsGoodsSheetOpen(false)}
      />
    </AppView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  barShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 10,
  },
});
