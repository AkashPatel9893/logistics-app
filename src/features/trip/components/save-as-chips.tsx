import { TextInput } from 'react-native';

import { AppPressable, AppText, AppView, Icon, type IconName } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  /** Labels already used by a saved address: those chips cannot be picked again. */
  taken?: readonly SaveAsLabel[];
  /** The name typed for a custom place ("Other"). */
  customName?: string;
  onChangeCustomName?: (name: string) => void;
}

/** Optional "save this place as" picker; tapping the selected chip clears it. */
export function SaveAsChips({
  value,
  onChange,
  taken = [],
  customName = '',
  onChangeCustomName,
}: SaveAsChipsProps) {
  const placeholderColor = useThemeColor('icon-subtle');
  return (
    <AppView className="mb-1">
      <AppText className="mb-2 text-[13px] font-medium text-foreground-secondary">
        Save as (optional):
      </AppText>
      <AppView className="flex-row gap-2.5">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const isTaken = taken.includes(option.value);
          return (
            <AppPressable
              key={option.value}
              disabled={isTaken}
              onPress={() => onChange(isSelected ? null : option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Save as ${option.label}`}
              accessibilityState={{ selected: isSelected, disabled: isTaken }}
              className={cn(
                'flex-row items-center gap-2 rounded-full border px-4 py-2.5',
                isSelected ? 'border-brand bg-brand-tint' : 'border-border bg-surface',
                isTaken && 'opacity-40',
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
      {taken.length > 0 ? (
        <AppText className="mt-2 text-[12px] text-subtle">
          {taken.map((label) => OPTIONS.find((o) => o.value === label)?.label).join(', ')} already
          saved. Use Other to name a new place.
        </AppText>
      ) : null}
      {value === 'other' && onChangeCustomName ? (
        <TextInput
          value={customName}
          onChangeText={onChangeCustomName}
          placeholder="Name this place, e.g. Mom's house"
          placeholderTextColor={placeholderColor}
          maxLength={40}
          autoCapitalize="words"
          accessibilityLabel="Name for this place"
          className="mt-3 rounded-xl border border-border-strong bg-surface px-4 py-3 text-[14px] font-medium text-foreground"
        />
      ) : null}
    </AppView>
  );
}
