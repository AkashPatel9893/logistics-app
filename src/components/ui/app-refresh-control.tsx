import { RefreshControl, type RefreshControlProps } from 'react-native';

import { haptics } from '@/lib/haptics';

export type AppRefreshControlProps = RefreshControlProps;

export function AppRefreshControl({
  tintColorClassName = 'accent-brand',
  colorsClassName = 'accent-brand',
  onRefresh,
  ...props
}: AppRefreshControlProps) {
  const handleRefresh = onRefresh
    ? () => {
        haptics.selection();
        onRefresh();
      }
    : undefined;

  return (
    <RefreshControl
      tintColorClassName={tintColorClassName}
      colorsClassName={colorsClassName}
      onRefresh={handleRefresh}
      {...props}
    />
  );
}
