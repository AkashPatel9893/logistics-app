import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

import { useThemeColor, type ThemeColor } from '@/hooks/use-theme-color';

export interface AppSpinnerProps extends Omit<ActivityIndicatorProps, 'color' | 'size'> {
  size?: 'small' | 'large';
  /** Theme token for the spinner color. */
  tone?: ThemeColor;
}

export function AppSpinner({ size = 'small', tone = 'foreground', ...props }: AppSpinnerProps) {
  const color = useThemeColor(tone);
  return (
    <ActivityIndicator
      size={size}
      color={color}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      {...props}
    />
  );
}
