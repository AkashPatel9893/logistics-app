export type BackButtonControlSize = 'mini' | 'small' | 'regular' | 'large' | 'extraLarge';

export interface LiquidGlassBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  /** Tap target size in points. */
  size?: number;
  controlSize?: BackButtonControlSize;
}
