import { StyleSheet } from 'react-native';

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
      style={[styles.button, { bottom: bottomOffset + 16, opacity: isLocating ? 0.7 : 1 }]}
      className="absolute right-4 items-center justify-center rounded-full border border-black/5 bg-white"
    >
      {isLocating ? <AppSpinner tone="brand" /> : <Icon name="scope" size={24} tone="brand" />}
    </AppPressable>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
});
