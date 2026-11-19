export type BackButtonControlSize = 'mini' | 'small' | 'regular' | 'large' | 'extraLarge';

export interface LiquidGlassBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
  controlSize?: BackButtonControlSize;
}
