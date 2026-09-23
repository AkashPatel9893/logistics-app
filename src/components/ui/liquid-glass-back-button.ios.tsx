import { Host, Button } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useUniwind } from 'uniwind';

export interface LiquidGlassBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
  controlSize?: 'mini' | 'small' | 'regular' | 'large' | 'extraLarge';
  className?: string;
}

export function LiquidGlassBackButton({
  onPress,
  accessibilityLabel = 'Back',
  size = 54,
  controlSize: controlSizeProp = 'extraLarge',
}: LiquidGlassBackButtonProps) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';

  return (
    <Host matchContents style={{ width: size, height: size }}>
      <Button
        label={accessibilityLabel}
        systemImage="chevron.left"
        modifiers={[
          buttonStyle('glass'),
          controlSize(controlSizeProp),
          labelStyle('iconOnly'),
          buttonBorderShape('circle'),
          tint(isDark ? '#F4F4F5' : '#18181B'),
        ]}
        onPress={onPress}
      />
    </Host>
  );
}
