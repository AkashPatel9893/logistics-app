import { AppText, AppView, Avatar, Icon } from '@/components/ui';
import type { Driver } from '@/lib/api/models';

export interface DriverInfoProps {
  /** null until a driver is assigned. */
  driver: Pick<Driver, 'name' | 'rating' | 'vehicleLabel' | 'vehiclePlate'> | null;
}

export function DriverInfo({ driver }: DriverInfoProps) {
  return (
    <AppView row className="mt-4 border-t border-divider pt-4">
      {driver ? (
        <>
          <Avatar name={driver.name} size="lg" />
          <AppView className="ml-3 flex-1">
            <AppView row className="gap-1.5">
              <AppText className="text-[15px] font-bold text-foreground">{driver.name}</AppText>
              <Icon name="star.fill" size={12} tone="brand" />
              <AppText className="text-[13px] font-semibold text-foreground-secondary">
                {driver.rating}
              </AppText>
            </AppView>
            <AppText className="mt-0.5 text-[12px] text-muted">
              {driver.vehicleLabel} · {driver.vehiclePlate}
            </AppText>
          </AppView>
        </>
      ) : (
        <AppText className="text-[13px] text-muted">
          We&apos;ll show your driver&apos;s details as soon as one is assigned.
        </AppText>
      )}
    </AppView>
  );
}
