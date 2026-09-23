import { AppPressable, AppText, AppView } from '@/components/ui';

import type { LanguageOption } from '../types';

export interface LanguagePillProps {
  language: LanguageOption;
  onPress: () => void;
}

export function LanguagePill({ language, onPress }: LanguagePillProps) {
  return (
    <AppView className="mt-1 items-center">
      <AppPressable
        onPress={onPress}
        accessibilityLabel={`Language: ${language.label}. Change language`}
        pressedClassName="active:opacity-75"
        className="flex-row items-center rounded-full border border-border bg-surface-muted/80 px-4 py-2"
      >
        <AppText className="mr-1.5 text-sm">🌐</AppText>
        <AppText className="text-sm font-medium text-foreground-emphasis">{language.label}</AppText>
        <AppText className="ml-1.5 text-[10px] text-muted">▼</AppText>
      </AppPressable>
    </AppView>
  );
}
