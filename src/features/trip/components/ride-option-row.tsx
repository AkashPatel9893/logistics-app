import { StyleSheet } from 'react-native';

import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import type { RideQuoteOption } from '@/lib/api/models';

import { VehicleImage } from './vehicle-image';

export interface RideOptionRowProps {
  option: RideQuoteOption;
  isSelected: boolean;
  onPress: () => void;
}

/** ₹55 rather than ₹55.00; paise only when there are some. */
export function formatFare(amount: number): string {
  return `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
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
  const price = formatFare(option.fare);
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
        {/* Soft rings behind the vehicle give the card some depth. */}
        <AppView className="absolute -right-12 -top-16 size-48 rounded-full bg-brand/[0.07]" />
        <AppView className="absolute -left-10 top-10 size-28 rounded-full bg-brand/[0.05]" />

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

const styles = StyleSheet.create({
  heroShadow: {
    shadowColor: '#ff5a1f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
});
