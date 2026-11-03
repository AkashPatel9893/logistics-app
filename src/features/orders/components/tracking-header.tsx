import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, LiquidGlassBackButton } from '@/components/ui';

export interface TrackingHeaderProps {
  onBack: () => void;
  title?: string;
  /** Shows a Help button; the receiver's public page has no support to go to. */
  onHelp?: () => void;
}

export function TrackingHeader({
  onBack,
  title = 'Track your package',
  onHelp,
}: TrackingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    // Back button and title share one row so the header leaves the map as much room as possible.
    <AppView
      style={{ paddingTop: insets.top + 8, zIndex: 10, elevation: 10 }}
      className="flex-row items-center gap-3 rounded-b-[28px] bg-brand px-5 pb-3"
    >
      <LiquidGlassBackButton onPress={onBack} size={40} controlSize="regular" />
      <AppText
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 text-[20px] font-extrabold tracking-tight text-brand-foreground"
      >
        {title}
      </AppText>
      {onHelp ? (
        <AppPressable
          onPress={onHelp}
          accessibilityLabel="Help with this order"
          hitSlop={8}
          className="rounded-full bg-white/20 px-3.5 py-2"
        >
          <AppText className="text-[13px] font-bold text-brand-foreground">Help</AppText>
        </AppPressable>
      ) : null}
    </AppView>
  );
}
