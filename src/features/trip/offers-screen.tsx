import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import {
  AnimatedView,
  AppKeyboardAvoidingView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  TextField,
  SkeletonCardList,
} from '@/components/ui';
import { useCoupons, useValidateCoupon } from '@/hooks/use-catalog';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Coupon } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { goBack } from '@/lib/go-back';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

/** "20% off, up to ₹50" / "₹40 off". */
function discountHeadline(coupon: Coupon): string {
  if (coupon.discountType === 'PERCENT' || coupon.discountType === 'PERCENTAGE') {
    const cap = coupon.maxDiscount ? `, up to ₹${coupon.maxDiscount}` : '';
    return `${coupon.discountValue}% off${cap}`;
  }
  return `₹${coupon.discountValue} off`;
}

function CouponCard({
  coupon,
  isApplied,
  onApply,
  onRemove,
}: {
  coupon: Coupon;
  isApplied: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  const conditions = [
    coupon.minFare ? `On trips above ₹${coupon.minFare}` : null,
    coupon.vehicleTypeCodes?.length ? 'Select vehicles only' : null,
    coupon.validUntil
      ? `Valid till ${new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : null,
  ].filter(Boolean);

  return (
    <AppView
      className={cn(
        'overflow-hidden rounded-[22px] bg-surface',
        isApplied && 'border-2 border-brand',
      )}
      style={styles.cardShadow}
    >
      <AppView row className="items-start p-4">
        <IconBadge
          name="percent"
          tone="brand"
          iconSize={20}
          className="mr-3 size-11 rounded-2xl bg-brand-soft"
        />
        <AppView className="flex-1">
          <AppText className="text-[17px] font-black text-foreground">
            {discountHeadline(coupon)}
          </AppText>
          <AppText className="mt-0.5 text-[14px] font-semibold text-foreground">
            {coupon.title}
          </AppText>
          {/* Many coupons repeat the title as the description; show it only when it adds something. */}
          {coupon.description && coupon.description !== coupon.title ? (
            <AppText className="mt-1 text-[12.5px] leading-[18px] text-muted">
              {coupon.description}
            </AppText>
          ) : null}
        </AppView>
      </AppView>
      {/* Perforated edge, like a ticket stub. */}
      <AppView row className="items-center">
        <AppView className="-ml-2.5 size-5 rounded-full bg-grouped" />
        <AppView className="mx-1 h-px flex-1 border-t border-dashed border-border" />
        <AppView className="-mr-2.5 size-5 rounded-full bg-grouped" />
      </AppView>
      <AppView row className="items-center px-4 py-3">
        <AppView className="flex-1 pr-3">
          <AppView className="self-start rounded-lg border border-dashed border-brand/50 bg-brand-soft px-2 py-0.5">
            <AppText className="text-[12.5px] font-black tracking-wider text-brand-strong">
              {coupon.code}
            </AppText>
          </AppView>
          {conditions.length > 0 ? (
            <AppText className="mt-1.5 text-[11.5px] text-muted">{conditions.join(' · ')}</AppText>
          ) : null}
        </AppView>
        {isApplied ? (
          <AppPressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove coupon ${coupon.code}`}
            className="flex-row items-center gap-1 rounded-xl bg-success/10 px-3 py-2"
          >
            <Icon name="checkmark.circle.fill" size={15} tone="success" />
            <AppText className="text-[13px] font-bold text-success">Applied</AppText>
          </AppPressable>
        ) : (
          <AppPressable
            onPress={onApply}
            accessibilityRole="button"
            accessibilityLabel={`Apply coupon ${coupon.code}`}
            className="rounded-xl bg-brand px-4 py-2"
          >
            <AppText className="text-[13px] font-bold text-brand-foreground">Apply</AppText>
          </AppPressable>
        )}
      </AppView>
    </AppView>
  );
}

/** Coupons & offers: type a code, or apply one of the customer's live coupons. */
export function OffersScreen() {
  const router = useRouter();
  const coupons = useCoupons();
  const validate = useValidateCoupon();
  const appliedCode = useTripStore((state) => state.draft.couponCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apply = (value: string) => {
    useTripStore.getState().setCouponCode(value);
    goBack(router);
  };

  const handleTypedApply = async () => {
    if (!code.trim() || validate.isPending) return;
    try {
      const coupon = await validate.mutateAsync(code);
      apply(coupon.code);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const list = coupons.data ?? [];

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Coupons & Offers" onBack={() => goBack(router)} className="pb-3" />
      <AppKeyboardAvoidingView>
        <AppView className="bg-surface px-4 pb-4 pt-1">
          <AppView row className="items-center gap-2.5">
            <TextField
              variant="outlined"
              className="flex-1"
              leading={<Icon name="tag.fill" size={15} tone="brand" />}
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/\s/g, '').toUpperCase());
                setError(null);
              }}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleTypedApply}
              accessibilityLabel="Coupon code"
            />
            <Button
              label="Apply"
              size="sm"
              className="h-14 px-5"
              disabled={!code.trim()}
              loading={validate.isPending}
              onPress={handleTypedApply}
            />
          </AppView>
          {error ? <AppText className="mt-1.5 px-1 text-[12px] text-error">{error}</AppText> : null}
        </AppView>

        <AppScrollView
          contentContainerClassName="flex-grow px-4 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {coupons.isPending ? (
            <SkeletonCardList count={4} />
          ) : coupons.isError ? (
            <AppView className="items-center py-16">
              <AppText className="text-center text-[13px] text-muted">
                {getErrorMessage(coupons.error)}
              </AppText>
              <Button
                label="Try again"
                variant="ghost"
                size="sm"
                onPress={() => coupons.refetch()}
              />
            </AppView>
          ) : list.length === 0 ? (
            <AppView className="flex-1 items-center justify-center py-16">
              <IconBadge
                name="gift.fill"
                tone="brand"
                iconSize={30}
                className="mb-4 size-20 bg-brand-soft"
              />
              <AppText className="text-[18px] font-bold text-foreground">No active offers</AppText>
              <AppText className="mt-1 text-[13px] text-muted">Please check back later</AppText>
            </AppView>
          ) : (
            <>
              <AppText className="mb-3 ml-1 text-[13px] font-semibold text-muted">
                {list.length} {list.length === 1 ? 'offer' : 'offers'} for you
              </AppText>
              <AppView className="gap-3">
                {list.map((coupon, index) => (
                  <AnimatedView
                    key={coupon.code}
                    entering={FadeInDown.duration(DURATION.enter)
                      .delay(staggerDelay(index))
                      .easing(ENTER_EASE_OUT)}
                  >
                    <CouponCard
                      coupon={coupon}
                      isApplied={appliedCode?.toUpperCase() === coupon.code.toUpperCase()}
                      onApply={() => apply(coupon.code)}
                      onRemove={() => useTripStore.getState().setCouponCode(null)}
                    />
                  </AnimatedView>
                ))}
              </AppView>
            </>
          )}
        </AppScrollView>
      </AppKeyboardAvoidingView>
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
});
