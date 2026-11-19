import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

import type { ThemeColor } from '@/hooks/use-theme-color';

const TONE_ACCENT_CLASS: Record<ThemeColor, string> = {
  brand: 'accent-brand',
  'brand-foreground': 'accent-brand-foreground',
  'brand-soft': 'accent-brand-soft',
  'brand-tint': 'accent-brand-tint',
  'brand-border': 'accent-brand-border',
  accent: 'accent-accent',
  'brand-strong': 'accent-brand-strong',
  background: 'accent-background',
  grouped: 'accent-grouped',
  canvas: 'accent-canvas',
  surface: 'accent-surface',
  'surface-muted': 'accent-surface-muted',
  thumb: 'accent-thumb',
  'search-field': 'accent-search-field',
  inverse: 'accent-inverse',
  'inverse-foreground': 'accent-inverse-foreground',
  promo: 'accent-promo',
  'promo-green': 'accent-promo-green',
  'promo-red-soft': 'accent-promo-red-soft',
  'promo-violet-soft': 'accent-promo-violet-soft',
  foreground: 'accent-foreground',
  'foreground-emphasis': 'accent-foreground-emphasis',
  'foreground-secondary': 'accent-foreground-secondary',
  'foreground-tertiary': 'accent-foreground-tertiary',
  muted: 'accent-muted',
  subtle: 'accent-subtle',
  icon: 'accent-icon',
  'icon-strong': 'accent-icon-strong',
  'icon-subtle': 'accent-icon-subtle',
  'icon-faint': 'accent-icon-faint',
  border: 'accent-border',
  'border-strong': 'accent-border-strong',
  divider: 'accent-divider',
  pickup: 'accent-pickup',
  success: 'accent-success',
  error: 'accent-error',
  danger: 'accent-danger',
  'danger-soft': 'accent-danger-soft',
  'danger-border': 'accent-danger-border',
  avatar: 'accent-avatar',
  'avatar-border': 'accent-avatar-border',
  'avatar-foreground': 'accent-avatar-foreground',
};

export interface AppSpinnerProps extends Omit<ActivityIndicatorProps, 'color' | 'size'> {
  size?: 'small' | 'large';
  tone?: ThemeColor;
}

export function AppSpinner({ size = 'small', tone = 'foreground', ...props }: AppSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      colorClassName={TONE_ACCENT_CLASS[tone]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      {...props}
    />
  );
}
