import { AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import { VehicleImage } from '@/components/vehicle-image';
import type { RideQuoteOption } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatFare } from '@/lib/format';

export interface RideOptionRowProps {
  option: RideQuoteOption;
  isSelected: boolean;
  onPress: () => void;
}

/** The backend words the payload as "500 kg capacity"; the card reads "Up to 500 kg". */
function formatDescription(description: string) {
  return description.replace(/^([\d.,]+\s?(?:kg|t))\s+capacity\b/i, 'Up to $1');
}

/**
 * One vehicle on the vehicle screen: a card with the picture, what fits, how soon a driver can
 * arrive and the price. The chosen one is outlined in the brand colour.
 */
export function RideOptionRow({ option, isSelected, onPress }: RideOptionRowProps) {
  // What the customer pays (after any coupon), the same amount as on the Proceed button.
  const price = formatFare(option.breakdown.total);
  const eta = option.etaMinutes !== null ? `${option.etaMinutes} min` : null;
  const description = formatDescription(option.description);
  const label = [option.name, price, description, eta && `pickup in ${eta}`]
    .filter(Boolean)
    .join(', ');

  return (
    <AppPressable
      onPress={onPress}
      pressScale={0.985}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isSelected }}
      // Same border width in both states, so the card never shifts when selected.
      className={cn(
        'mb-3 flex-row items-center rounded-[20px] border-[1.5px] bg-surface px-3.5 py-3.5 shadow-card-subtle',
        isSelected ? 'border-brand' : 'border-border',
      )}
    >
      <AppView center className="mr-3.5 h-[64px] w-[84px]">
        <VehicleImage
          imageUrl={option.imageUrl}
          code={option.vehicleCode}
          style={{ width: 84, height: 60 }}
        />
      </AppView>

      <AppView className="flex-1 pr-3">
        <AppText numberOfLines={1} className="text-[17px] font-bold text-foreground">
          {option.name}
        </AppText>
        {description ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
            {description}
          </AppText>
        ) : null}
        {eta ? (
          <AppView row className="mt-1.5 gap-1.5">
            <Icon name="clock" size={14} tone="muted" />
            <AppText className="text-[13px] font-medium text-muted">{eta}</AppText>
          </AppView>
        ) : null}
      </AppView>

      <AppText
        className={cn(
          'text-[24px] font-bold tabular-nums',
          isSelected ? 'text-brand' : 'text-foreground',
        )}
      >
        {price}
      </AppText>
    </AppPressable>
  );
}

/** Placeholder rows shaped like the vehicle list, shown while the quote loads. */
export function RideOptionsSkeleton() {
  return (
    <AppView>
      {[0, 1, 2, 3].map((key) => (
        <AppView
          key={key}
          row
          className="mb-3 rounded-[20px] border-[1.5px] border-border px-3.5 py-3.5"
        >
          <Skeleton className="mr-3.5 h-[60px] w-[84px] rounded-2xl" />
          <AppView className="flex-1 gap-2 pr-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </AppView>
          <Skeleton className="h-6 w-14 rounded-md" />
        </AppView>
      ))}
    </AppView>
  );
}
