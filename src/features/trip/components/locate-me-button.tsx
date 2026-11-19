import { AppPressable, AppSpinner, Icon } from '@/components/ui';

export interface LocateMeButtonProps {
  onPress: () => void;
  isLocating: boolean;
  bottomOffset: number;
}

export function LocateMeButton({ onPress, isLocating, bottomOffset }: LocateMeButtonProps) {
  return (
    <AppPressable
      onPress={onPress}
      disabled={isLocating}
      accessibilityLabel="Use my current location"
      accessibilityState={{ busy: isLocating }}
      style={{ bottom: bottomOffset + 16, opacity: isLocating ? 0.7 : 1 }}
      className="absolute right-4 z-[999] size-[52px] items-center justify-center rounded-full border border-border bg-surface shadow-locate"
    >
      {isLocating ? <AppSpinner tone="brand" /> : <Icon name="scope" size={24} tone="brand" />}
    </AppPressable>
  );
}
