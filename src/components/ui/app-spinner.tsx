import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export type SpinnerVariant = 'primary' | 'white' | 'accent' | 'muted';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'small' | 'large';

export interface AppSpinnerProps extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  variant?: SpinnerVariant;
  size?: SpinnerSize | number;
  className?: string;
  color?: string;
}

const variantColors: Record<SpinnerVariant, string> = {
  primary: '#171717',
  white: '#FFFFFF',
  accent: '#F97316',
  muted: '#9CA3AF',
};

const sizeMap: Record<SpinnerSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
  small: 'small',
  large: 'large',
};

export function AppSpinner({
  variant = 'primary',
  size = 'md',
  color,
  className,
  ...props
}: AppSpinnerProps) {
  const finalColor = color ?? variantColors[variant];
  const nativeSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <AppView className={cn('items-center justify-center', className)}>
      <ActivityIndicator
        size={nativeSize}
        color={finalColor}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        {...props}
      />
    </AppView>
  );
}

export const ActivityIndicatorWrapper = AppSpinner;
