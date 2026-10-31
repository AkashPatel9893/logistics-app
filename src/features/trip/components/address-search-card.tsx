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
  onSelectOnMap: () => void;
  onToggleSavedAddresses: () => void;
  isSavedAddressesActive: boolean;
  dropPlaceholder?: string;
  /** Searching for one stop of a multi-stop trip: shows only that stop's numbered field. */
  stopNumber?: number;
  /** Shows the "+" beside the drop field that opens the multi-stop list. */
  onAddStop?: () => void;
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
  onSelectOnMap,
  onToggleSavedAddresses,
  isSavedAddressesActive,
  dropPlaceholder = 'Where is your Drop ?',
  stopNumber,
  onAddStop,
  onSwap,
}: AddressSearchCardProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const placeholderColor = useThemeColor('icon-subtle');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AppView className="mx-4 mb-3">
      {/* Main card with Pickup & Drop stops */}
      <AppView className="overflow-hidden rounded-2xl bg-surface p-4 shadow-sm border border-border/40">
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
            <AppView className="flex-row items-center justify-between">
              <StopConnector className="ml-[26px]" />
              {onSwap ? (
                <AppPressable
                  onPress={onSwap}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Swap pickup and drop"
                  className="mr-1 size-8 items-center justify-center rounded-full border border-border bg-surface-muted"
                >
                  <Icon name="arrow.up.arrow.down" size={16} tone="brand" />
                </AppPressable>
              ) : null}
            </AppView>
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
        ) : (
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
        )}
      </AppView>

      {/* Action Strip: "Select on map" | "Saved Addresses" */}
      <AppView className="mt-3 flex-row items-center justify-around rounded-xl bg-surface py-3 px-2 border border-border/40 shadow-sm">
        <AppPressable
          onPress={onSelectOnMap}
          className="flex-1 flex-row items-center justify-center gap-2"
        >
          <Icon name="location" size={16} color="#2563EB" />
          <AppText className="text-[13px] font-bold text-foreground">Select on map</AppText>
        </AppPressable>

        <AppView className="h-4 w-[1px] bg-border" />

        <AppPressable
          onPress={onToggleSavedAddresses}
          className="flex-1 flex-row items-center justify-center gap-2"
        >
          <Icon
            name={isSavedAddressesActive ? 'heart.fill' : 'heart'}
            size={16}
            color={isSavedAddressesActive ? '#2563EB' : '#2563EB'}
          />
          <AppText
            className={cn(
              'text-[13px] font-bold',
              isSavedAddressesActive ? 'text-brand' : 'text-foreground',
            )}
          >
            Saved Addresses
          </AppText>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

/** Pickup marker, the same look as the pin on the map: a green dot in a ring. */
function PickupDot() {
  return (
    <AppView className="mr-2.5 size-7 items-center justify-center rounded-full border-[3px] border-emerald-500 bg-white">
      <AppView className="size-2 rounded-full bg-emerald-500" />
    </AppView>
  );
}

/** Drop marker, the same look as the pin on the map: a dark square in a white ring. */
function DropDot() {
  return (
    <AppView className="mr-2.5 size-7 items-center justify-center rounded-md border-[3px] border-white bg-neutral-900 shadow-sm">
      <AppView className="size-2 bg-white" />
    </AppView>
  );
}
