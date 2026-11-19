import { StatusBar, type StatusBarStyle } from 'expo-status-bar';

import { useIsFocused } from '@/lib/navigation';

export interface FocusAwareStatusBarProps {
  style?: StatusBarStyle;
}

export function FocusAwareStatusBar({ style = 'auto' }: FocusAwareStatusBarProps) {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar style={style} /> : null;
}
