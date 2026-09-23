import { useIsFocused } from 'expo-router';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';

export interface FocusAwareStatusBarProps {
  /** `auto` follows the theme; `light` for screens with a dark/brand header. */
  style?: StatusBarStyle;
}

/**
 * Status bar owned by the focused screen only, so a screen with a brand-colored
 * header can switch to light text without leaking that into the next screen.
 */
export function FocusAwareStatusBar({ style = 'auto' }: FocusAwareStatusBarProps) {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar style={style} /> : null;
}
