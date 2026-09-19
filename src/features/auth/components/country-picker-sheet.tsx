import { BottomSheet, Host } from '@expo/ui';
import { useCallback, useMemo, useState } from 'react';
import { ListRenderItemInfo, TextInput, useWindowDimensions } from 'react-native';

import { AppFlatList, AppPressable, AppText, AppView, useThemeConfig } from '@/components/ui';
import { cn } from '@/lib/cn';

import { MOCK_COUNTRIES } from '../mock-data';
import type { CountryCode } from '../types';

export interface CountryPickerSheetProps {
  isPresented: boolean;
  selectedCountry: CountryCode;
  onSelect: (country: CountryCode) => void;
  onDismiss: () => void;
}

const ITEM_HEIGHT = 52;
const countryKeyExtractor = (item: CountryCode) => item.id;
const getCountryItemLayout = (_: unknown, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

export function CountryPickerSheet({
  isPresented,
  selectedCountry,
  onSelect,
  onDismiss,
}: CountryPickerSheetProps) {
  const theme = useThemeConfig();
  const { width: screenWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_COUNTRIES;
    return MOCK_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(query) || c.dialCode.includes(query),
    );
  }, [search]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CountryCode>) => {
      const isSelected = item.id === selectedCountry.id;
      return (
        <AppPressable
          onPress={() => {
            onSelect(item);
            onDismiss();
          }}
          className={cn(
            'w-full flex-row items-center py-3.5 px-3 rounded-xl border-b border-neutral-50 dark:border-neutral-800/50',
            isSelected && 'bg-orange-50 dark:bg-orange-950/30',
          )}
        >
          <AppText className="text-2xl mr-3">{item.flag}</AppText>
          <AppText className="flex-1 text-base font-medium text-neutral-800 dark:text-neutral-200">
            {item.name}
          </AppText>
          <AppText className="text-base font-semibold text-neutral-500 dark:text-neutral-400">
            {item.dialCode}
          </AppText>
        </AppPressable>
      );
    },
    [selectedCountry.id, onSelect, onDismiss],
  );

  if (!isPresented) {
    return null;
  }

  return (
    <Host style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BottomSheet
        isPresented={isPresented}
        onDismiss={onDismiss}
        snapPoints={['half', 'full']}
        showDragIndicator={true}
        contentPadding={0}
        containerColor={theme.dark ? '#171717' : '#FFFFFF'}
      >
        <AppView
          className="flex-1 w-full bg-white dark:bg-neutral-900 px-5 pt-3 pb-6"
          style={{ width: screenWidth }}
        >
          <AppView className="w-full flex-row items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
            <AppText className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              Select Country
            </AppText>
            <AppPressable onPress={onDismiss} className="px-2 py-1">
              <AppText className="text-base font-semibold text-orange-600 dark:text-orange-400">
                Done
              </AppText>
            </AppPressable>
          </AppView>

          <AppView className="w-full my-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 h-11 justify-center">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search country or code..."
              placeholderTextColor="#9CA3AF"
              className="text-base text-neutral-900 dark:text-neutral-100 p-0 w-full"
              clearButtonMode="while-editing"
            />
          </AppView>

          <AppFlatList
            style={{ width: '100%' }}
            data={filteredCountries}
            keyExtractor={countryKeyExtractor}
            getItemLayout={getCountryItemLayout}
            renderItem={renderItem}
          />
        </AppView>
      </BottomSheet>
    </Host>
  );
}
