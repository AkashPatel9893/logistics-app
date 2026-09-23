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

// Native SwiftUI tint; zinc-100 / zinc-900 to sit on Liquid Glass in either theme.
const TINT = { dark: '#F4F4F5', light: '#18181B' } as const;

/** iOS: native SwiftUI Liquid Glass back button. */
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
