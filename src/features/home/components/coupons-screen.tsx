import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppScrollView, AppText, AppView, Card, Icon } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { COUPONS, type Coupon } from '@/features/home/coupons';
import { cn } from '@/lib/cn';
import { useTripStore } from '@/stores/trip-store';

interface CouponCardProps {
  coupon: Coupon;
  isApplied: boolean;
  onToggle: () => void;
}

function CouponCard({ coupon, isApplied, onToggle }: CouponCardProps) {
  return (
    <Card
      variant="outline"
      className={cn(
        'p-4 mb-3',
        isApplied
          ? 'border-[#FF5A1F] bg-orange-50/40 dark:bg-orange-950/20'
          : 'border-neutral-100 dark:border-neutral-800',
      )}
    >
      <AppView className="flex-row items-center justify-between">
        <AppView className="flex-row items-center gap-2 px-2.5 py-1 rounded-lg border border-dashed border-orange-300 dark:border-orange-900">
          <Icon name="tag.fill" size={12} color="#FF5A1F" />
          <AppText className="text-[13px] font-extrabold tracking-wider text-[#FF5A1F]">
            {coupon.code}
          </AppText>
        </AppView>
        <AppPressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isApplied ? `Remove coupon ${coupon.code}` : `Apply coupon ${coupon.code}`
          }
        >
          <AppText
            className={cn(
              'text-[14px] font-bold',
              isApplied ? 'text-neutral-500 dark:text-neutral-400' : 'text-[#FF5A1F]',
            )}
          >
            {isApplied ? 'Remove' : 'Apply'}
          </AppText>
        </AppPressable>
      </AppView>
      <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 mt-3">
        {coupon.title}
      </AppText>
      <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-[17px]">
        {coupon.description}
      </AppText>
    </Card>
  );
}

export function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const appliedCode = useTripStore.use.draft().couponCode;

  const handleToggle = (coupon: Coupon) => {
    const isApplied = appliedCode === coupon.code;
    useTripStore.getState().setCouponCode(isApplied ? null : coupon.code);
    if (!isApplied) router.back();
  };

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppView style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-4">
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppText className="ml-3 text-[19px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Coupons & offers
        </AppText>
      </AppView>

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
          The applied coupon is used on your next booking. Eligibility is checked on the booking
          screen.
        </AppText>
        {COUPONS.map((coupon) => (
          <CouponCard
            key={coupon.code}
            coupon={coupon}
            isApplied={appliedCode === coupon.code}
            onToggle={() => handleToggle(coupon)}
          />
        ))}
      </AppScrollView>
    </AppView>
  );
}
