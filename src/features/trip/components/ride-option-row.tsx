import { AppImage, AppPressable, AppText, AppView, Card, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { RideQuoteOption } from '@/lib/api/models';

import { getVehicleImage } from '../vehicle-catalog';

export interface RideOptionRowProps {
  option: RideQuoteOption;
  isSelected: boolean;
  onPress: () => void;
}

export function RideOptionRow({ option, isSelected, onPress }: RideOptionRowProps) {
  const { fare } = option;
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${option.name}, ₹${fare}, ${option.etaMinutes} minutes away`}
      accessibilityState={{ checked: isSelected }}
      className="mb-3"
    >
      <Card
        variant={isSelected ? 'default' : 'outline'}
        className={cn(
          'flex-row items-center p-3',
          isSelected ? 'border-brand bg-brand-tint' : 'border-divider',
        )}
      >
        <AppView center className="mr-3 size-12 overflow-hidden rounded-xl bg-thumb">
          <AppImage
            source={getVehicleImage(option.imageKey)}
            contentFit="contain"
            style={{ width: 40, height: 40 }}
          />
        </AppView>
        <AppView className="flex-1">
          <AppText className="text-[15px] font-bold text-foreground">{option.name}</AppText>
          <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
            {option.description}
          </AppText>
          <AppView row className="mt-1 gap-1">
            <Icon name="clock" size={11} tone="icon-subtle" />
            <AppText className="text-[11px] text-subtle">{option.etaMinutes} min</AppText>
          </AppView>
        </AppView>
        <AppText className="text-[16px] font-bold text-foreground">₹{fare}</AppText>
      </Card>
    </AppPressable>
  );
}
