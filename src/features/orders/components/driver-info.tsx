import { AppPressable, AppText, AppView, Avatar, Icon } from '@/components/ui';
import type { Driver } from '@/lib/api/models';

export interface DriverInfoProps {
  /** null until a driver is assigned. */
  driver: Pick<Driver, 'name' | 'rating' | 'vehicleLabel' | 'vehiclePlate'> | null;
  searching?: boolean;
  /** Left out when there is no number to call. */
  onCall?: () => void;
}

export function DriverInfo({ driver, onCall, searching = false }: DriverInfoProps) {
  if (!driver) {
    return (
      <AppView row className="mt-4 items-center gap-3 rounded-2xl bg-surface-muted p-4">
        <AppView className="size-11 items-center justify-center rounded-full bg-brand-tint">
          <Icon name="person.fill" size={21} tone="brand" />
        </AppView>
        <AppView className="flex-1">
          <AppText className="text-[15px] font-bold text-foreground">
            {searching ? 'We’re finding your driver' : 'Driver details unavailable'}
          </AppText>
          <AppText className="mt-1 text-[13px] text-muted">
            {searching
              ? 'We’ll show their details as soon as they accept your order.'
              : 'We’ll show their details when they’re available.'}
          </AppText>
        </AppView>
      </AppView>
    );
  }

  return (
    <AppView row className="mt-4 rounded-2xl bg-surface-muted p-3">
      <Avatar name={driver.name || 'Driver'} size="md" />
      <AppView className="ml-3 flex-1">
        <AppView row className="gap-1.5">
          <AppText numberOfLines={1} className="shrink text-[15px] font-bold text-foreground">
            {driver.name || 'Driver assigned'}
          </AppText>
          {driver.rating !== null ? (
            <>
              <Icon name="star.fill" size={12} tone="brand" />
              <AppText className="text-[13px] font-semibold text-foreground-secondary">
                {driver.rating}
              </AppText>
            </>
          ) : null}
        </AppView>
        {driver.vehicleLabel ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
            {driver.vehicleLabel}
          </AppText>
        ) : null}
        {driver.vehiclePlate ? (
          <AppText
            accessibilityLabel={`Vehicle registration ${driver.vehiclePlate}`}
            className="mt-1 text-[14px] font-bold text-foreground"
          >
            {driver.vehiclePlate}
          </AppText>
        ) : null}
      </AppView>
      {onCall ? (
        <AppPressable
          onPress={onCall}
          accessibilityLabel="Call driver"
          className="ml-3 size-11 items-center justify-center rounded-full bg-brand"
        >
          <Icon name="phone.fill" size={18} tone="brand-foreground" />
        </AppPressable>
      ) : null}
    </AppView>
  );
}
