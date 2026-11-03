import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppScrollView,
  AppSpinner,
  AppText,
  AppView,
  Button,
  Card,
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
  return <AppText className="mb-2 mt-5 text-[15px] font-bold text-foreground">{children}</AppText>;
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
    createOrder.mutate(
      {
        pickup: {
          label: draft.pickupLabel,
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
          location: draft.dropRegion,
          houseNumber: draft.dropDetails?.houseNumber ?? '',
          contact: draft.dropDetails
            ? { name: draft.dropDetails.contactName, phone: draft.dropDetails.contactPhone }
            : null,
        },
        stops: draft.midStops.map((stop) => ({
          label: stop.label || 'Stop',
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

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Review Booking" onBack={() => goBack(router)} />
      <AppKeyboardAvoidingView>
        <AppScrollView ref={scrollRef} contentContainerClassName="px-4 pb-4">
          <Card className="px-0 pt-4">
            {selected ? (
              <AppText className="mb-2 px-4 text-[15px] font-bold text-foreground">
                {selected.name}
              </AppText>
            ) : null}
            <RouteSummary draft={draft} />
          </Card>

          <SectionTitle>Payment Method</SectionTitle>
          {paymentMethod ? (
            <AppPressable
              onPress={() => router.push('/wallet')}
              accessibilityLabel={`Payment method: ${paymentMethod.label}. Change`}
            >
              <Card className="flex-row items-center border-brand bg-brand-tint p-3">
                <Icon name={PAYMENT_METHOD_ICON[paymentMethod.type]} size={18} tone="brand" />
                <AppView className="ml-3 flex-1">
                  <AppText className="text-[15px] font-semibold text-foreground">
                    {paymentMethod.label}
                  </AppText>
                  <AppText className="mt-0.5 text-[12px] text-muted">
                    Pay the driver at delivery
                  </AppText>
                </AppView>
                <Icon name="chevron.right" size={14} tone="icon-subtle" />
              </Card>
            </AppPressable>
          ) : (
            <AppView className="py-4">
              <AppSpinner tone="brand" />
            </AppView>
          )}

          <SectionTitle>Coupon</SectionTitle>
          <CouponField
            appliedCode={draft.couponCode}
            check={selected?.coupon ?? null}
            onApply={handleApplyCoupon}
            onRemove={() => useTripStore.getState().setCouponCode(null)}
          />

          <SectionTitle>Fare Breakdown</SectionTitle>
          {selected ? (
            <Card className="p-4">
              {fareLines(selected.breakdown, (type) => !NON_CHARGE_LINES.has(type))}
              {selected.breakdown.discount > 0 ? (
                <FareLine
                  label="Coupon discount"
                  value={`− ${rupees(selected.breakdown.discount)}`}
                />
              ) : null}
              {/* Tax last: it's worked out on the fare after the discount. */}
              {fareLines(selected.breakdown, (type) => type === 'TAX')}
              <AppView className="mt-3 border-t border-divider pt-1">
                <FareLine label="Total" value={rupees(selected.breakdown.total)} strong />
              </AppView>
            </Card>
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
        </AppScrollView>

        <AppView
          style={{ paddingBottom: insets.bottom + 12 }}
          className="border-t border-divider bg-surface px-4 pt-3"
        >
          <Button
            label={selected ? `Book Now · ${rupees(selected.breakdown.total)}` : 'Book Now'}
            className="h-14"
            disabled={!selected || !paymentMethod}
            loading={createOrder.isPending}
            onPress={handleBook}
          />
        </AppView>
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
