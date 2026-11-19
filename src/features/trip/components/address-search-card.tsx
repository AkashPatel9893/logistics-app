import { useRef, useState } from 'react';

import {
  AppPressable,
  AppSpinner,
  AppText,
  AppTextInput,
  AppView,
  Icon,
  type AppTextInputInstance,
} from '@/components/ui';
import { cn } from '@/lib/cn';

import { StopBadge } from './stop-badge';
import { StopConnector } from './stop-connector';

export interface AddressSearchCardProps {
  isPickupMode: boolean;
  pickupLabel: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  onPickupPress: () => void;
  dropLabel?: string;
  onDropPress?: () => void;
  query: string;
  onChangeQuery: (query: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
  dropPlaceholder?: string;
  stopNumber?: number;
  onAddStop?: () => void;
  showDrop?: boolean;
  onSwap?: () => void;
}

export function AddressSearchCard({
  isPickupMode,
  pickupLabel,
  pickupContactName = '',
  pickupContactPhone = '',
  onPickupPress,
  dropLabel,
  onDropPress,
  query,
  onChangeQuery,
  onSubmit,
  isSearching,
  dropPlaceholder = 'Where is your Drop ?',
  stopNumber,
  onAddStop,
  onSwap,
  showDrop = true,
}: AddressSearchCardProps) {
  const inputRef = useRef<AppTextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AppView className="mx-4 mb-3">
      <AppView className="overflow-hidden rounded-3xl border border-border/40 bg-surface p-3 shadow-sm">
        {stopNumber === undefined ? (
          <>
            {!isPickupMode ? (
              <AppPressable
                onPress={onPickupPress}
                accessibilityLabel={`Pickup: ${pickupLabel}. Tap to change.`}
                className="flex-row items-center justify-between border border-transparent px-3"
              >
                <AppView className="flex-row items-center flex-1 pr-2">
                  <StopBadge kind="pickup" className="mr-2.5" />

                  <AppView className="flex-1">
                    <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                      {[pickupContactName, pickupContactPhone].filter(Boolean).join(' · ') ||
                        'Add sender details'}
                    </AppText>
                    <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-subtle">
                      {pickupLabel || 'Select pickup location'}
                    </AppText>
                  </AppView>
                </AppView>

                <Icon name="chevron.right" size={16} tone="icon-subtle" />
              </AppPressable>
            ) : (
              <AppView
                className={cn(
                  'flex-row items-center rounded-xl bg-surface px-3 py-2.5 border',
                  isFocused ? 'border-brand border-2' : 'border-border-strong',
                )}
              >
                <StopBadge kind="pickup" className="mr-2.5" />
                <AppTextInput
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChangeText={onChangeQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Where is your Pickup ?"
                  returnKeyType="search"
                  onSubmitEditing={onSubmit}
                  autoCorrect={false}
                  className="flex-1 p-0 text-[14px] font-medium text-foreground"
                />
                {isSearching ? (
                  <AppSpinner tone="brand" />
                ) : query.length > 0 ? (
                  <AppPressable onPress={() => onChangeQuery('')} hitSlop={8} className="mr-2">
                    <Icon name="xmark.circle.fill" size={16} tone="icon-faint" />
                  </AppPressable>
                ) : null}
              </AppView>
            )}

            {showDrop ? (
              <AppView className="flex-row items-center justify-between">
                <StopConnector className="ml-[26px]" />
                {onSwap ? (
                  <AppPressable
                    onPress={onSwap}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Swap pickup and drop"
                    className="mr-1 size-8 items-center justify-center"
                  >
                    <Icon name="arrow.up.arrow.down" size={16} tone="brand" />
                  </AppPressable>
                ) : null}
              </AppView>
            ) : null}
          </>
        ) : null}

        {!isPickupMode ? (
          <AppView
            className={cn(
              'flex-row items-center rounded-xl bg-surface px-3 py-2 border',
              isFocused ? 'border-brand border-2' : 'border-border-strong',
            )}
          >
            <StopBadge
              kind={stopNumber !== undefined ? 'stop' : 'drop'}
              number={stopNumber}
              className="mr-2.5"
            />

            <AppTextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={onChangeQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={dropPlaceholder}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
              autoCorrect={false}
              className="flex-1 p-0 text-[14px] font-medium text-foreground"
            />

            {isSearching ? (
              <AppSpinner tone="brand" />
            ) : query.length > 0 ? (
              <AppPressable onPress={() => onChangeQuery('')} hitSlop={8} className="mr-2">
                <Icon name="xmark.circle.fill" size={16} tone="icon-faint" />
              </AppPressable>
            ) : null}
            {onAddStop ? (
              <AppPressable
                onPress={onAddStop}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add stops"
                className="ml-1 size-7 items-center justify-center rounded-full bg-surface-muted"
              >
                <Icon name="plus" size={16} tone="foreground" />
              </AppPressable>
            ) : null}
          </AppView>
        ) : showDrop ? (
          <AppPressable
            onPress={onDropPress}
            accessibilityLabel={`Drop: ${dropLabel || 'Select drop'}. Tap to change.`}
            className="flex-row items-center justify-between border border-transparent px-3"
          >
            <AppView className="flex-row items-center flex-1 pr-2">
              <StopBadge kind="drop" className="mr-2.5" />
              <AppText numberOfLines={1} className="flex-1 text-[14px] font-medium text-foreground">
                {dropLabel || 'Where is your Drop ?'}
              </AppText>
            </AppView>
            <Icon name="chevron.right" size={16} tone="icon-subtle" />
          </AppPressable>
        ) : null}
      </AppView>
    </AppView>
  );
}
