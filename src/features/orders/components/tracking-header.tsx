import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, AppView, LiquidGlassBackButton } from '@/components/ui';

export interface TrackingHeaderProps {
  onBack: () => void;
  title?: string;
}

export function TrackingHeader({ onBack, title = 'Track your package' }: TrackingHeaderProps) {
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
        className="flex-1 text-[22px] font-extrabold tracking-tight text-brand-foreground"
      >
        {title}
      </AppText>
    </AppView>
  );
}
