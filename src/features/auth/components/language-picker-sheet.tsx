import { BottomSheet, Host } from '@expo/ui';
import React, { useCallback } from 'react';
import { ListRenderItemInfo, useWindowDimensions } from 'react-native';

import { AppFlatList, AppPressable, AppText, AppView, useThemeConfig } from '@/components/ui';
import { cn } from '@/lib/cn';

import { MOCK_LANGUAGES } from '../mock-data';
import type { LanguageOption } from '../types';

export interface LanguagePickerSheetProps {
  isPresented: boolean;
  selectedLanguage: LanguageOption;
  onSelect: (lang: LanguageOption) => void;
  onDismiss: () => void;
}

const ITEM_HEIGHT = 56;
const languageKeyExtractor = (item: LanguageOption) => item.code;
const getLanguageItemLayout = (_: unknown, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

export function LanguagePickerSheet({
  isPresented,
  selectedLanguage,
  onSelect,
  onDismiss,
}: LanguagePickerSheetProps) {
  const theme = useThemeConfig();
  const { width: screenWidth } = useWindowDimensions();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LanguageOption>) => {
      const isSelected = item.code === selectedLanguage.code;
      return (
        <AppPressable
          onPress={() => {
            onSelect(item);
            onDismiss();
          }}
          className={cn(
            'w-full flex-row items-center justify-between py-4 px-3 rounded-xl border-b border-neutral-50 dark:border-neutral-800/50',
            isSelected && 'bg-orange-50 dark:bg-orange-950/30',
          )}
        >
          <AppView className="flex-row items-baseline gap-2">
            <AppText className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
              {item.label}
            </AppText>
            <AppText className="text-sm text-neutral-500 dark:text-neutral-400">
              {item.nativeLabel}
            </AppText>
          </AppView>
          {isSelected && (
            <AppText className="text-lg font-bold text-orange-600 dark:text-orange-400">✓</AppText>
          )}
        </AppPressable>
      );
    },
    [selectedLanguage.code, onSelect, onDismiss],
  );

  if (!isPresented) {
    return null;
  }

  return (
    <Host style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BottomSheet
        isPresented={isPresented}
        onDismiss={onDismiss}
        snapPoints={['half']}
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
              Select Language
            </AppText>
            <AppPressable onPress={onDismiss} className="px-2 py-1">
              <AppText className="text-base font-semibold text-orange-600 dark:text-orange-400">
                Done
              </AppText>
            </AppPressable>
          </AppView>

          <AppFlatList
            style={{ width: '100%' }}
            data={MOCK_LANGUAGES}
            keyExtractor={languageKeyExtractor}
            getItemLayout={getLanguageItemLayout}
            className="mt-2"
            renderItem={renderItem}
          />
        </AppView>
      </BottomSheet>
    </Host>
  );
}
