import {
  AppPressable,
  AppText,
  AppView,
  Button,
  Card,
  Icon,
  IconBadge,
  Skeleton,
} from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import { getErrorMessage } from '@/lib/api/api-error';
import { type CouponCheck, type RideQuote, type RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatFare } from '@/lib/format';
import { type TripDraft } from '@/stores';

import { type GoodsType } from './goods-type-sheet';

function CardTitle({ children }: { children: string }) {
  return (
    <AppText accessibilityRole="header" className="mb-1 text-[16px] font-bold text-foreground">
      {children}
    </AppText>
  );
}

export function ReviewVehicleCard({
  selected,
  draft,
  onPressAddressDetails,
}: {
  selected: RideQuoteOption | null;
  draft: TripDraft;
  onPressAddressDetails: () => void;
}) {
  const routeSummary = [draft.pickupLabel || 'Pickup', draft.dropLabel || 'Drop'].join(' → ');

  return (
    <Card variant="elevated" className="rounded-3xl p-3.5">
      <AppView row className="items-center">
        <AppView
          center
          className="mr-3 h-[64px] w-[76px] overflow-hidden rounded-2xl bg-brand-soft"
        >
          <VehicleImage
            imageUrl={selected?.imageUrl}
            code={selected?.vehicleCode}
            style={{ width: 68, height: 54 }}
          />
        </AppView>
        <AppView className="flex-1 pr-2">
          <AppText numberOfLines={1} className="text-[17px] font-bold text-foreground">
            {selected?.name ?? 'Your vehicle'}
          </AppText>
          {selected?.description ? (
            <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
              {selected.description}
            </AppText>
          ) : null}
          <AppView row className="mt-1 items-center gap-1.5">
            <AppText numberOfLines={1} className="flex-1 text-[12px] font-medium text-subtle">
              {routeSummary}
            </AppText>
            {draft.midStops.length > 0 ? (
              <AppView className="rounded-full bg-surface-muted px-2 py-0.5">
                <AppText className="text-[11px] font-semibold text-muted">
                  +{draft.midStops.length} {draft.midStops.length === 1 ? 'stop' : 'stops'}
                </AppText>
              </AppView>
            ) : null}
          </AppView>
          <AppPressable
            onPress={onPressAddressDetails}
            accessibilityRole="button"
            hitSlop={6}
            className="mt-1.5 flex-row items-center self-start"
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
  );
}

export function ReviewOffersCard({
  couponCode,
  coupon,
  onPressOffers,
  onRemoveCoupon,
}: {
  couponCode: string | null;
  coupon: CouponCheck | null;
  onPressOffers: () => void;
  onRemoveCoupon: () => void;
}) {
  return (
    <Card variant="elevated" className="rounded-3xl">
      <CardTitle>Offers & discounts</CardTitle>
      <AppPressable
        onPress={onPressOffers}
        accessibilityRole="button"
        accessibilityLabel={couponCode ? `Coupon ${couponCode} applied. Change` : 'Apply coupon'}
        pressScale={0.98}
        className={cn(
          'mt-2 flex-row items-center rounded-2xl p-3',
          couponCode ? 'bg-success/10' : 'bg-surface-muted',
        )}
      >
        <IconBadge
          name="percent"
          iconSize={17}
          tone={couponCode ? 'success' : 'brand'}
          className="mr-3 rounded-xl bg-surface"
        />
        <AppView className="flex-1">
          <AppText className="text-[15px] font-bold text-foreground">
            {couponCode ? `${couponCode} applied` : 'Apply coupon'}
          </AppText>
          {couponCode && coupon ? (
            <AppText
              className={cn(
                'mt-0.5 text-[12px]',
                coupon.valid ? 'font-semibold text-success' : 'text-error',
              )}
            >
              {coupon.valid ? `You save ${formatFare(coupon.discount)}` : coupon.reason}
            </AppText>
          ) : !couponCode ? (
            <AppText className="mt-0.5 text-[12px] text-muted">See offers for this trip</AppText>
          ) : null}
        </AppView>
        {couponCode ? (
          <AppPressable
            onPress={onRemoveCoupon}
            accessibilityRole="button"
            accessibilityLabel={`Remove coupon ${couponCode}`}
            hitSlop={8}
          >
            <AppText className="text-[13px] font-bold text-muted">Remove</AppText>
          </AppPressable>
        ) : (
          <Icon name="chevron.right" size={15} tone="icon-subtle" />
        )}
      </AppPressable>
    </Card>
  );
}

export function ReviewFareCard({
  selected,
  quoteData,
  isError,
  error,
  onChooseAnother,
  onRetry,
}: {
  selected: RideQuoteOption | null;
  quoteData: RideQuote | undefined;
  isError: boolean;
  error: unknown;
  onChooseAnother: () => void;
  onRetry: () => void;
}) {
  return (
    <Card variant="elevated" className="rounded-3xl pt-3.5">
      <CardTitle>Fare</CardTitle>
      {selected ? (
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
            {formatFare(selected.breakdown.total)}
          </AppText>
        </AppView>
      ) : quoteData ? (
        <AppView className="items-center py-4">
          <AppText className="text-center text-[13px] text-muted">
            This vehicle is no longer available.
          </AppText>
          <Button label="Choose another" variant="ghost" size="sm" onPress={onChooseAnother} />
        </AppView>
      ) : isError ? (
        <AppView className="items-center py-4">
          <AppText className="text-center text-[13px] text-muted">{getErrorMessage(error)}</AppText>
          <Button label="Try again" variant="ghost" size="sm" onPress={onRetry} />
        </AppView>
      ) : (
        <AppView row className="mt-1 items-end justify-between">
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </AppView>
      )}
    </Card>
  );
}

export function ReviewGoodsCard({
  goods,
  onPressGoods,
  onPressRestricted,
}: {
  goods: GoodsType | null;
  onPressGoods: () => void;
  onPressRestricted: () => void;
}) {
  return (
    <Card variant="elevated" className="overflow-hidden rounded-3xl p-0">
      <AppView className="p-4 pb-3.5">
        <CardTitle>Goods description</CardTitle>
        <AppPressable
          onPress={onPressGoods}
          accessibilityRole="button"
          accessibilityLabel={goods ? `Goods: ${goods.label}. Change` : 'Choose goods type'}
          pressScale={0.98}
          className={cn(
            'mt-2 flex-row items-center rounded-2xl p-3',
            goods ? 'bg-surface-muted' : 'border-2 border-dashed border-brand/40 bg-brand-soft',
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
        onPress={onPressRestricted}
        accessibilityRole="button"
        accessibilityLabel="Do not send restricted items. View list"
        className="flex-row items-center bg-amber-50 px-4 py-3 dark:bg-amber-500/10"
      >
        <Icon name="exclamationmark.bubble.fill" size={18} color="#D97706" />
        <AppText className="ml-2.5 flex-1 text-[14px] font-medium text-foreground">
          Do not send restricted items
        </AppText>
        <AppText className="mr-1 text-[13px] font-bold text-brand-strong">View list</AppText>
        <Icon name="chevron.right" size={13} tone="brand" />
      </AppPressable>
    </Card>
  );
}

export function ReviewRulesCard({ rules }: { rules: readonly string[] }) {
  return (
    <Card variant="elevated" className="rounded-3xl">
      <CardTitle>Read before booking</CardTitle>
      <AppView className="mt-2 gap-2">
        {rules.map((rule) => (
          <AppView key={rule} row className="items-start">
            <AppText className="mr-2 text-[13px] text-muted">•</AppText>
            <AppText className="flex-1 text-[13px] leading-[19px] text-muted">{rule}</AppText>
          </AppView>
        ))}
      </AppView>
    </Card>
  );
}
