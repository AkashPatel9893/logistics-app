import { Button, Host } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useUniwind } from 'uniwind';

import type { LiquidGlassBackButtonProps } from './liquid-glass-back-button.types';

export type { LiquidGlassBackButtonProps };

const TINT = { dark: '#F4F4F5', light: '#18181B' } as const;

export function LiquidGlassBackButton({
  onPress,
  accessibilityLabel = 'Back',
  size = 54,
  controlSize: controlSizeProp = 'extraLarge',
}: LiquidGlassBackButtonProps) {
  const { theme } = useUniwind();

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
          tint(theme === 'dark' ? TINT.dark : TINT.light),
        ]}
        onPress={onPress}
      />
    </Host>
  );
}
