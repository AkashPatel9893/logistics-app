import { RefreshControl, type RefreshControlProps } from 'react-native';

import { haptics } from '@/lib/haptics';

export type AppRefreshControlProps = RefreshControlProps;

/** Centralized RefreshControl styled with Uniwind brand accent tokens and tactile pull feedback. */
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
