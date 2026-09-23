import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, AppView, LiquidGlassBackButton } from '@/components/ui';

export interface TrackingHeaderProps {
  onBack: () => void;
  title?: string;
}

export function TrackingHeader({ onBack, title = 'Track your package' }: TrackingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppView
      style={{ paddingTop: insets.top + 8, zIndex: 10, elevation: 10 }}
      className="rounded-b-[28px] bg-brand px-5 pb-4"
    >
      <AppView className="mb-4">
        <LiquidGlassBackButton onPress={onBack} size={40} controlSize="regular" />
      </AppView>
      <AppText
        accessibilityRole="header"
        numberOfLines={2}
        className="text-[28px] font-extrabold leading-9 tracking-tight text-brand-foreground"
      >
        {title}
      </AppText>
    </AppView>
  );
}
