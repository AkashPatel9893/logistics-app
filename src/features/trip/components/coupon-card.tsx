import { AppPressable, AppText, AppView, Icon, IconBadge } from '@/components/ui';
import type { Coupon } from '@/lib/api/models';
import { cn } from '@/lib/cn';

function discountHeadline(coupon: Coupon): string {
  if (coupon.discountType === 'PERCENT' || coupon.discountType === 'PERCENTAGE') {
    const cap = coupon.maxDiscount ? `, up to ₹${coupon.maxDiscount}` : '';
    return `${coupon.discountValue}% off${cap}`;
  }
  return `₹${coupon.discountValue} off`;
}

export interface CouponCardProps {
  coupon: Coupon;
  isApplied: boolean;
  onApply: () => void;
  onRemove: () => void;
}

export function CouponCard({ coupon, isApplied, onApply, onRemove }: CouponCardProps) {
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
        'overflow-hidden rounded-[22px] bg-surface shadow-card',
        isApplied && 'border-2 border-brand',
      )}
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
          {coupon.description && coupon.description !== coupon.title ? (
            <AppText className="mt-1 text-[12.5px] leading-[18px] text-muted">
              {coupon.description}
            </AppText>
          ) : null}
        </AppView>
      </AppView>
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
