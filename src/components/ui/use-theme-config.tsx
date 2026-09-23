import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useMemo } from 'react';
import { useUniwind } from 'uniwind';

import { useThemeColors } from '@/hooks/use-theme-color';

/** React Navigation theme built from the same tokens as the rest of the UI. */
export function useThemeConfig(): Theme {
  const { theme } = useUniwind();
  const [brand, background, surface, foreground, border] = useThemeColors([
    'brand',
    'background',
    'surface',
    'foreground',
    'border',
  ] as const);

  return useMemo(() => {
    const base = theme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: brand,
        background,
        card: surface,
        text: foreground,
        border,
        notification: brand,
      },
    };
  }, [theme, brand, background, surface, foreground, border]);
}
