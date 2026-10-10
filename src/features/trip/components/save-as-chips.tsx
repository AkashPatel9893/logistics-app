import { AppPressable, AppText, AppView, Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

export type SaveAsLabel = 'home' | 'shop' | 'other';

const OPTIONS: readonly { value: SaveAsLabel; label: string; icon: IconName }[] = [
  { value: 'home', label: 'Home', icon: 'house.fill' },
  { value: 'shop', label: 'Shop', icon: 'storefront.fill' },
  { value: 'other', label: 'Other', icon: 'heart.fill' },
];

export interface SaveAsChipsProps {
  value: SaveAsLabel | null;
  onChange: (value: SaveAsLabel | null) => void;
}

/** Optional "save this place as" picker; tapping the selected chip clears it. */
export function SaveAsChips({ value, onChange }: SaveAsChipsProps) {
  return (
    <AppView className="mb-1">
      <AppText className="mb-2 text-[13px] font-medium text-foreground-secondary">
        Save as (optional):
      </AppText>
      <AppView className="flex-row gap-2.5">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <AppPressable
              key={option.value}
              onPress={() => onChange(isSelected ? null : option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Save as ${option.label}`}
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'flex-row items-center gap-2 rounded-full border px-4 py-2.5',
                isSelected ? 'border-brand bg-brand-tint' : 'border-border bg-surface',
              )}
            >
              <Icon name={option.icon} size={15} tone={isSelected ? 'brand' : 'foreground'} />
              <AppText
                className={cn(
                  'text-[14px] font-medium',
                  isSelected ? 'text-brand' : 'text-foreground',
                )}
              >
                {option.label}
              </AppText>
            </AppPressable>
          );
        })}
      </AppView>
    </AppView>
  );
}
