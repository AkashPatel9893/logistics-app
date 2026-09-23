import { useRef } from 'react';
import { TextInput } from 'react-native';

import { AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

function RouteConnector() {
  return (
    <AppView className="ml-[21px] gap-[3px] py-0.5">
      {[0, 1, 2].map((i) => (
        <AppView key={i} className="h-[3px] w-[2px] rounded-[1px] bg-icon-faint" />
      ))}
    </AppView>
  );
}

export interface AddressSearchCardProps {
  isPickupMode: boolean;
  pickupLabel: string;
  onPickupPress: () => void;
  query: string;
  onChangeQuery: (query: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
}

/** Pickup summary (drop mode only) above the search input. */
export function AddressSearchCard({
  isPickupMode,
  pickupLabel,
  onPickupPress,
  query,
  onChangeQuery,
  onSubmit,
  isSearching,
}: AddressSearchCardProps) {
  const inputRef = useRef<TextInput>(null);
  const placeholderColor = useThemeColor('icon-subtle');

  return (
    <AppView className="mx-4 mb-4 overflow-hidden rounded-2xl bg-surface">
      {!isPickupMode ? (
        <>
          <AppPressable
            onPress={onPickupPress}
            accessibilityLabel={`Pickup: ${pickupLabel}. Change pickup`}
            className="flex-row items-center px-4 pb-2 pt-4"
          >
            <AppView className="mr-3 size-3 rounded-full bg-pickup" />
            <AppText numberOfLines={1} className="flex-1 text-[14px] font-medium text-foreground">
              {pickupLabel}
            </AppText>
          </AppPressable>
          <RouteConnector />
        </>
      ) : null}

      <AppPressable
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
        className={cn('flex-row items-center px-4', isPickupMode ? 'py-4' : 'pb-4 pt-2')}
      >
        <AppView
          className={cn('mr-3 size-3 rounded-full', isPickupMode ? 'bg-pickup' : 'bg-brand')}
        />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeQuery}
          placeholder={isPickupMode ? 'Search a pickup location' : 'Search a drop location'}
          placeholderTextColor={placeholderColor}
          accessibilityLabel={isPickupMode ? 'Pickup location' : 'Drop location'}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoCorrect={false}
          className="flex-1 p-0 text-[14px] font-medium text-foreground"
        />
        {isSearching ? (
          <AppSpinner tone="brand" />
        ) : query.length > 0 ? (
          <AppPressable
            onPress={() => onChangeQuery('')}
            hitSlop={8}
            accessibilityLabel="Clear search"
            className="mr-2"
          >
            <Icon name="xmark.circle.fill" size={16} tone="icon-faint" />
          </AppPressable>
        ) : null}
      </AppPressable>
    </AppView>
  );
}
