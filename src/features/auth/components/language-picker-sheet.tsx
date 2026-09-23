import { BottomSheet, Host, RNHostView } from '@expo/ui';
import { useWindowDimensions, type ListRenderItemInfo } from 'react-native';

import { AppFlatList, AppPressable, AppText, AppView } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

import type { LanguageOption } from '../types';

const keyExtractor = (item: LanguageOption) => item.code;

interface LanguageRowProps {
  language: LanguageOption;
  isSelected: boolean;
  onPress: () => void;
}

function LanguageRow({ language, isSelected, onPress }: LanguageRowProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      className={cn(
        'w-full flex-row items-center justify-between rounded-xl border-b border-divider px-3 py-4',
        isSelected && 'bg-brand-soft',
      )}
    >
      <AppView className="flex-row items-baseline gap-2">
        <AppText className="text-base font-semibold text-foreground-emphasis">
          {language.label}
        </AppText>
        <AppText className="text-sm text-muted">{language.nativeLabel}</AppText>
      </AppView>
      {isSelected ? <AppText className="text-lg font-bold text-brand-strong">✓</AppText> : null}
    </AppPressable>
  );
}

export interface LanguagePickerSheetProps {
  languages: LanguageOption[];
  isPresented: boolean;
  selectedLanguage: LanguageOption;
  onSelect: (language: LanguageOption) => void;
  onDismiss: () => void;
}

export function LanguagePickerSheet({
  languages,
  isPresented,
  selectedLanguage,
  onSelect,
  onDismiss,
}: LanguagePickerSheetProps) {
  const surfaceColor = useThemeColor('surface');
  const { width } = useWindowDimensions();

  if (!isPresented) return null;

  const renderItem = ({ item }: ListRenderItemInfo<LanguageOption>) => (
    <LanguageRow
      language={item}
      isSelected={item.code === selectedLanguage.code}
      onPress={() => {
        onSelect(item);
        onDismiss();
      }}
    />
  );

  return (
    <Host style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BottomSheet
        isPresented={isPresented}
        onDismiss={onDismiss}
        snapPoints={['half']}
        showDragIndicator
        contentPadding={0}
        containerColor={surfaceColor}
      >
        {/*
          RN content inside the native sheet must sit in an RNHostView: without
          it, Android's Compose sheet shows the rows but never delivers taps.
        */}
        <RNHostView matchContents>
          <AppView className="w-full bg-surface px-5 pb-6 pt-3" style={{ width }}>
            <AppView className="w-full flex-row items-center justify-between border-b border-divider py-3">
              <AppText accessibilityRole="header" className="text-lg font-bold text-foreground">
                Select Language
              </AppText>
              <AppPressable onPress={onDismiss} className="px-2 py-1">
                <AppText className="text-base font-semibold text-brand-strong">Done</AppText>
              </AppPressable>
            </AppView>
            <AppFlatList
              data={languages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              className="mt-2 w-full"
            />
          </AppView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
