import { useRef, useState } from 'react';
import { TextInput, type TextInputInstance } from 'react-native';

import { AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

import { StopConnector } from './stop-connector';

export interface AddressSearchCardProps {
  isPickupMode: boolean;
  pickupLabel: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  onPickupPress: () => void;
  dropLabel?: string;
  dropContactName?: string;
  dropContactPhone?: string;
  onDropPress?: () => void;
  query: string;
  onChangeQuery: (query: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
  dropPlaceholder?: string;
  /** Searching for one stop of a multi-stop trip: shows only that stop's numbered field. */
  stopNumber?: number;
  /** Shows the "+" beside the drop field that opens the multi-stop list. */
  onAddStop?: () => void;
  /** False hides the drop row while choosing the pickup. */
  showDrop?: boolean;
  /** Shows a button that swaps pickup and drop. */
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
  const inputRef = useRef<TextInputInstance>(null);
  const placeholderColor = useThemeColor('icon-subtle');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AppView className="mx-4 mb-3">
      {/* Main card with Pickup & Drop stops */}
      <AppView className="overflow-hidden rounded-3xl border border-border/40 bg-surface p-3 shadow-sm">
        {stopNumber === undefined ? (
          <>
            {/* Pickup Row */}
            {!isPickupMode ? (
              <AppPressable
                onPress={onPickupPress}
                accessibilityLabel={`Pickup: ${pickupLabel}. Tap to change.`}
                className="flex-row items-center justify-between border border-transparent px-3"
              >
                <AppView className="flex-row items-center flex-1 pr-2">
                  <PickupDot />

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
              /* Active Pickup Input */
              <AppView
                className={cn(
                  'flex-row items-center rounded-xl bg-surface px-3 py-2.5 border',
                  isFocused ? 'border-brand border-2' : 'border-border-strong',
                )}
              >
                <PickupDot />
                <TextInput
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChangeText={onChangeQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Where is your Pickup ?"
                  placeholderTextColor={placeholderColor}
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

            {/* Vertical Dotted Connector — centered under the stop icons; the swap button sits at its right */}
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

        {/* Drop Row */}
        {!isPickupMode ? (
          /* Active Drop Input matching PHOTO-2026-09-26-17-11-28.jpg */
          <AppView
            className={cn(
              'flex-row items-center rounded-xl bg-surface px-3 py-2 border',
              isFocused ? 'border-brand border-2' : 'border-border-strong',
            )}
          >
            {stopNumber !== undefined ? (
              <AppView className="size-7 rounded-full bg-slate-600 items-center justify-center mr-2.5">
                <AppText className="text-[12px] font-bold text-white">{stopNumber}</AppText>
              </AppView>
            ) : (
              <DropDot />
            )}

            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={onChangeQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={dropPlaceholder}
              placeholderTextColor={placeholderColor}
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
          /* Drop summary when picking pickup */
          <AppPressable
            onPress={onDropPress}
            accessibilityLabel={`Drop: ${dropLabel || 'Select drop'}. Tap to change.`}
            className="flex-row items-center justify-between border border-transparent px-3"
          >
            <AppView className="flex-row items-center flex-1 pr-2">
              <DropDot />
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

/** Pickup: a green circle with an up arrow. */
function PickupDot() {
  return (
    <AppView className="mr-2.5 size-7 items-center justify-center rounded-full bg-emerald-500">
      <Icon name="arrow.up" size={14} color="#FFFFFF" />
    </AppView>
  );
}

/** Drop: a red circle with a down arrow. */
function DropDot() {
  return (
    <AppView className="mr-2.5 size-7 items-center justify-center rounded-full bg-rose-500">
      <Icon name="arrow.down" size={14} color="#FFFFFF" />
    </AppView>
  );
}
