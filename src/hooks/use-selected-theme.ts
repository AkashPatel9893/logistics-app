import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';

import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

export type SelectedTheme = 'light' | 'dark' | 'system';

export function loadSelectedTheme(): SelectedTheme {
  const savedTheme =
    (kvStorage.getString(STORAGE_KEYS.SELECTED_THEME) as SelectedTheme) || 'system';
  try {
    Uniwind.setTheme(savedTheme);
  } catch {}
  return savedTheme;
}

export function useSelectedTheme() {
  const systemColorScheme = useColorScheme();
  const [selectedTheme, setSelectedThemeState] = useState<SelectedTheme>(() => {
    return (kvStorage.getString(STORAGE_KEYS.SELECTED_THEME) as SelectedTheme) || 'system';
  });

  const setSelectedTheme = useCallback((newTheme: SelectedTheme) => {
    setSelectedThemeState(newTheme);
    kvStorage.setString(STORAGE_KEYS.SELECTED_THEME, newTheme);
    try {
      Uniwind.setTheme(newTheme);
    } catch {}
  }, []);

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
