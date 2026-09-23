import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

import { AppScrollView, AppText, AppView, Button } from '@/components/ui';

export interface LocationDetailsPanelProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  onSubmit: () => void;
  bottomInset: number;
  children: ReactNode;
}

/** Scrollable form area + submit button shown in the sheet's details step. */
export function LocationDetailsPanel({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  bottomInset,
  children,
}: LocationDetailsPanelProps) {
  const { height } = useWindowDimensions();

  return (
    <>
      <AppScrollView
        style={{ maxHeight: height * 0.6 }}
        className="grow-0"
        contentContainerClassName="grow-0"
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
      >
        <AppText className={`text-[17px] font-bold text-foreground ${subtitle ? 'mb-1' : 'mb-4'}`}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={2} className="mb-4 text-[13px] text-muted">
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </AppScrollView>
      <AppView className="px-4" style={{ paddingBottom: bottomInset + 16 }}>
        <Button
          label={submitLabel}
          variant="brand"
          onPress={onSubmit}
          className="h-auto py-3.5"
          textClassName="text-[15px]"
        />
      </AppView>
    </>
  );
}
