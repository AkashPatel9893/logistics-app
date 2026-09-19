import { DarkTheme as _DarkTheme, DefaultTheme } from 'expo-router';
import { useUniwind } from 'uniwind';

import { colors } from './colors';

export type NavigationTheme = typeof _DarkTheme;

export const DarkTheme: NavigationTheme = {
  ..._DarkTheme,
  colors: {
    ..._DarkTheme.colors,
    primary: colors.primary[500],
    background: colors.charcoal[950],
    text: colors.charcoal[100],
    border: colors.charcoal[800],
    card: colors.charcoal[900],
    notification: colors.primary[500],
  },
};

export const LightTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary[500],
    background: colors.charcoal[50],
    text: colors.charcoal[900],
    border: colors.charcoal[200],
    card: colors.white,
    notification: colors.primary[500],
  },
};

export function useThemeConfig() {
  const { theme } = useUniwind();
  if (theme === 'dark') return DarkTheme;
  return LightTheme;
}
