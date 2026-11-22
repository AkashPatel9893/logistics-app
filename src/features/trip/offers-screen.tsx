import {
  AnimatedView,
  AppFlatList,
  AppKeyboardAvoidingView,
  AppText,
  AppView,
  Button,
  EmptyState,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
  SkeletonCardList,
  TextField,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION, ENTER_EASE_OUT, FadeInDown, staggerDelay } from '@/lib/motion';
import { goBack, useRouter } from '@/lib/navigation';
import { useCoupons } from '@/queries';

import { CouponCard } from './components/coupon-card';
import { useCouponInput } from './hooks/use-coupon-input';

export function OffersScreen() {
  const router = useRouter();
  const coupons = useCoupons();
  const {
    appliedCode,
    code,
    error,
    isValidating,
    onChangeCode,
    applyCode,
    removeCode,
    handleTypedApply,
  } = useCouponInput();

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
              onChangeText={onChangeCode}
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
              loading={isValidating}
              onPress={handleTypedApply}
            />
          </AppView>
          {error ? <AppText className="mt-1.5 px-1 text-[12px] text-error">{error}</AppText> : null}
        </AppView>

        {coupons.isPending ? (
          <AppView className="px-4 pt-4">
            <SkeletonCardList count={4} />
          </AppView>
        ) : coupons.isError ? (
          <AppView className="items-center px-4 py-16">
            <AppText className="text-center text-[13px] text-muted">
              {getErrorMessage(coupons.error)}
            </AppText>
            <Button label="Try again" variant="ghost" size="sm" onPress={() => coupons.refetch()} />
          </AppView>
        ) : list.length === 0 ? (
          <AppView className="flex-1 justify-center pb-16">
            <EmptyState
              illustration="offers"
              title="No active offers"
              subtitle="New discounts and promo codes will show up here, or enter a code above."
            />
          </AppView>
        ) : (
          <AppFlatList
            data={list}
            keyExtractor={(item) => item.code}
            contentContainerClassName="px-4 pb-8 pt-4"
            ListHeaderComponent={
              <AppText className="mb-3 ml-1 text-[13px] font-semibold text-muted">
                {list.length} {list.length === 1 ? 'offer' : 'offers'} for you
              </AppText>
            }
            renderItem={({ item: coupon, index }) => (
              <AnimatedView
                entering={FadeInDown.duration(DURATION.enter)
                  .delay(staggerDelay(index))
                  .easing(ENTER_EASE_OUT)}
                className="mb-3"
              >
                <CouponCard
                  coupon={coupon}
                  isApplied={appliedCode?.toUpperCase() === coupon.code.toUpperCase()}
                  onApply={() => applyCode(coupon.code)}
                  onRemove={removeCode}
                />
              </AnimatedView>
            )}
          />
        )}
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
