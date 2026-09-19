import React from 'react';

import { AppPressable, AppText, AppView } from '@/components/ui';

import type { LanguageOption } from '../types';

export interface LanguagePillProps {
  language: LanguageOption;
  onPress: () => void;
}

export function LanguagePill({ language, onPress }: LanguagePillProps) {
  return (
    <AppView className="items-center mt-1">
      <AppPressable
        onPress={onPress}
        className="flex-row items-center bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-2 active:opacity-75"
      >
        <AppText className="text-sm mr-1.5">🌐</AppText>
        <AppText className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {language.label}
        </AppText>
        <AppText className="text-[10px] text-neutral-500 dark:text-neutral-400 ml-1.5">▼</AppText>
      </AppPressable>
    </AppView>
  );
}
