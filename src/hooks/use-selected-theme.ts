import { useEffect } from 'react';
import { Uniwind } from 'uniwind';

import { useColorScheme } from '@/lib/native';
import { loadSelectedTheme, useThemeStore, type SelectedTheme } from '@/stores/theme-store';

export { loadSelectedTheme, type SelectedTheme };

export function useSelectedTheme() {
  const systemColorScheme = useColorScheme();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const setSelectedTheme = useThemeStore((s) => s.setSelectedTheme);

  useEffect(() => {
    try {
      Uniwind.setTheme(selectedTheme);
    } catch {}
  }, [selectedTheme, systemColorScheme]);

  return {
    selectedTheme,
    setSelectedTheme,
  };
}
