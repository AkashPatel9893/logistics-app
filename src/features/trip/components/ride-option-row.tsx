import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import type { RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';

import { VehicleImage } from './vehicle-image';

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
 * One vehicle on the vehicle screen. Like Porter, the chosen one opens into a
 * large highlighted card with a big picture; the rest stay compact rows.
 */
export function RideOptionRow({ option, isSelected, onPress }: RideOptionRowProps) {
  const price = `₹${option.fare.toFixed(2)}`;
  const details = detailLine(option);

  return (
    <AppPressable
      onPress={onPress}
      pressScale={isSelected ? 1 : 0.98}
      accessibilityRole="radio"
      accessibilityLabel={[option.name, price, details].filter(Boolean).join(', ')}
      accessibilityState={{ checked: isSelected }}
      className={cn(
        'mb-2 rounded-2xl',
        isSelected
          ? 'border-2 border-brand bg-brand-tint p-4'
          : 'border border-transparent px-3 py-2.5',
      )}
    >
      {isSelected ? (
        <>
          <AppView className="absolute right-3 top-3 size-6 items-center justify-center rounded-full bg-brand">
            <Icon name="checkmark" size={14} color="#FFFFFF" />
          </AppView>
          <AppView center className="mb-2 h-[84px]">
            <VehicleImage
              imageUrl={option.imageUrl}
              className="rounded-2xl"
              style={{ width: 120, height: 84 }}
              fallbackIconSize={44}
            />
          </AppView>
          <AppView row className="items-end">
            <AppView className="flex-1 pr-3">
              <AppText numberOfLines={1} className="text-[18px] font-bold text-foreground">
                {option.name}
              </AppText>
              {details ? (
                <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
                  {details}
                </AppText>
              ) : null}
            </AppView>
            <AppText className="text-[19px] font-bold tabular-nums text-foreground">
              {price}
            </AppText>
          </AppView>
        </>
      ) : (
        <AppView row className="items-center">
          <AppView center className="mr-3 size-[52px] overflow-hidden rounded-xl bg-surface">
            <VehicleImage
              imageUrl={option.imageUrl}
              style={{ width: 44, height: 44 }}
              fallbackIconSize={24}
            />
          </AppView>
          <AppView className="flex-1 pr-3">
            <AppText numberOfLines={1} className="text-[15px] font-semibold text-foreground">
              {option.name}
            </AppText>
            {details ? (
              <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                {details}
              </AppText>
            ) : null}
          </AppView>
          <AppText className="text-[15px] font-semibold tabular-nums text-foreground">
            {price}
          </AppText>
        </AppView>
      )}
    </AppPressable>
  );
}
