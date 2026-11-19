import type { ReactNode } from 'react';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  type ButtonVariant,
} from '@/components/ui';
import { useWindowDimensions } from '@/lib/native';

import { StopBadge } from './stop-badge';

export interface LocationDetailsPanelProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  onSubmit: () => void;
  onChangeLocation?: () => void;
  stop?: 'pickup' | 'drop';
  bottomInset: number;
  children: ReactNode;
}

export function LocationDetailsPanel({
  title,
  subtitle,
  submitLabel,
  submitVariant = 'brand',
  onSubmit,
  onChangeLocation,
  stop = 'drop',
  bottomInset,
  children,
}: LocationDetailsPanelProps) {
  const { height } = useWindowDimensions();

  return (
    <>
      <AppScrollView
        style={{ maxHeight: height * 0.6 }}
        flex={false}
        contentContainerClassName="p-5 pt-2"
      >
        {onChangeLocation ? (
          <AppView className="mb-4 flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
            <StopBadge kind={stop} />
            <AppView className="flex-1">
              <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
                {title}
              </AppText>
              {subtitle ? (
                <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
                  {subtitle}
                </AppText>
              ) : null}
            </AppView>
            <AppPressable
              onPress={onChangeLocation}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Change ${stop} location`}
              className="rounded-xl border border-brand px-3.5 py-2"
            >
              <AppText className="text-[13px] font-bold text-brand">Change</AppText>
            </AppPressable>
          </AppView>
        ) : (
          <>
            <AppText
              className={`text-[17px] font-bold text-foreground ${subtitle ? 'mb-1' : 'mb-4'}`}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText numberOfLines={2} className="mb-4 text-[13px] text-muted">
                {subtitle}
              </AppText>
            ) : null}
          </>
        )}
        {children}
      </AppScrollView>
      <AppView className="px-4" style={{ paddingBottom: bottomInset + 16 }}>
        <Button
          label={submitLabel}
          variant={submitVariant}
          onPress={onSubmit}
          className="h-auto py-3.5"
          textClassName="text-[15px]"
        />
      </AppView>
    </>
  );
}
