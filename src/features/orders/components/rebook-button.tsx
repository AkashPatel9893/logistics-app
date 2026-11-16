import { AppPressable, AppSpinner, AppText, Icon } from '@/components/ui';

export interface RebookButtonProps {
  onPress: () => void;
  isBusy: boolean;
}

/** "Book again" pill on a past order in the history. */
export function RebookButton({ onPress, isBusy }: RebookButtonProps) {
  return (
    <AppPressable
      onPress={onPress}
      disabled={isBusy}
      pressScale={0.96}
      accessibilityRole="button"
      accessibilityLabel="Book again"
      accessibilityState={{ busy: isBusy }}
      className="min-h-9 flex-row items-center gap-1.5 rounded-full bg-brand px-3.5 py-2"
    >
      {isBusy ? (
        <AppSpinner tone="brand-foreground" />
      ) : (
        <Icon name="arrow.clockwise" size={13} tone="brand-foreground" weight="bold" />
      )}
      <AppText className="text-[13px] font-bold text-brand-foreground">Book again</AppText>
    </AppPressable>
  );
}
