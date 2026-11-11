import { StyleSheet } from 'react-native';

import { AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import type { RideQuoteOption } from '@/lib/api/models';
import { formatFare } from '@/lib/format';

import { VehicleImage } from '@/components/vehicle-image';

export interface RideOptionRowProps {
  option: RideQuoteOption;
  isSelected: boolean;
  onPress: () => void;
}

/** "500 kg capacity · 8 min": what fits, then how soon a driver can arrive. */
function detailLine(option: RideQuoteOption) {
  return [option.description, option.etaMinutes !== null ? `${option.etaMinutes} min` : null]
    .filter(Boolean)
    .join(' · ');
}

/**
 * One vehicle on the vehicle screen. Like Porter, the chosen one opens into a large hero card
 * with a big picture; the rest stay compact rows.
 */
export function RideOptionRow({ option, isSelected, onPress }: RideOptionRowProps) {
  // What the customer pays (after any coupon), the same amount as on the Proceed button.
  const price = formatFare(option.breakdown.total);
  const details = detailLine(option);
  const label = [option.name, price, details].filter(Boolean).join(', ');

  if (isSelected) {
    return (
      <AppPressable
        onPress={onPress}
        pressScale={1}
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ checked: true }}
        className="mb-2 overflow-hidden rounded-[26px] border-2 border-brand bg-brand-soft"
        style={styles.heroShadow}
      >
        <AppView row className="items-center justify-between px-4 pt-3.5">
          {option.etaMinutes !== null ? (
            <AppView row className="items-center gap-1 rounded-full bg-surface px-2.5 py-1">
              <Icon name="clock" size={12} tone="brand" />
              <AppText className="text-[11.5px] font-bold text-foreground">
                Pickup in {option.etaMinutes} min
              </AppText>
            </AppView>
          ) : (
            <AppView />
          )}
          <AppView center className="size-6 rounded-full bg-brand">
            <Icon name="checkmark" size={14} tone="brand-foreground" />
          </AppView>
        </AppView>

        <AppView center className="h-[104px]">
          <VehicleImage
            imageUrl={option.imageUrl}
            style={{ width: 150, height: 96 }}
            fallbackClassName="size-20 rounded-full bg-surface"
            fallbackIconSize={38}
            fallbackTone="brand"
          />
        </AppView>

        <AppView row className="items-end px-4 pb-4 pt-1">
          <AppView className="flex-1 pr-3">
            <AppText numberOfLines={1} className="text-[20px] font-bold text-foreground">
              {option.name}
            </AppText>
            {option.description ? (
              <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
                {option.description}
              </AppText>
            ) : null}
          </AppView>
          <AppText className="text-[24px] font-black tabular-nums text-foreground">{price}</AppText>
        </AppView>
      </AppPressable>
    );
  }

  return (
    <AppPressable
      onPress={onPress}
      pressScale={0.98}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: false }}
      className="mb-1 flex-row items-center rounded-[20px] px-2 py-2.5"
    >
      <AppView
        center
        className="mr-3.5 h-[56px] w-[64px] overflow-hidden rounded-2xl bg-surface-muted"
      >
        <VehicleImage
          imageUrl={option.imageUrl}
          style={{ width: 56, height: 46 }}
          fallbackClassName="size-9 rounded-full bg-surface"
          fallbackIconSize={18}
          fallbackTone="icon"
        />
      </AppView>
      <AppView className="flex-1 pr-3">
        <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
          {option.name}
        </AppText>
        {details ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[12.5px] text-muted">
            {details}
          </AppText>
        ) : null}
      </AppView>
      <AppText className="text-[16px] font-bold tabular-nums text-foreground">{price}</AppText>
    </AppPressable>
  );
}

/** Placeholder rows shaped like the vehicle list, shown while the quote loads. */
export function RideOptionsSkeleton() {
  return (
    <AppView>
      <Skeleton className="mb-2 h-[188px] w-full rounded-[26px]" />
      {[0, 1, 2].map((key) => (
        <AppView key={key} row className="mb-1 items-center px-2 py-2.5">
          <Skeleton className="mr-3.5 h-[56px] w-[64px] rounded-2xl" />
          <AppView className="flex-1 gap-2 pr-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </AppView>
          <Skeleton className="h-4 w-12 rounded-md" />
        </AppView>
      ))}
    </AppView>
  );
}

const styles = StyleSheet.create({
  heroShadow: {
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
});
