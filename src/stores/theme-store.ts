import { Uniwind } from 'uniwind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStateStorage, STORAGE_KEYS } from '@/lib/storage';

export type SelectedTheme = 'light' | 'dark' | 'system';

function applyUniwindTheme(theme: SelectedTheme) {
  try {
    Uniwind.setTheme(theme);
  } catch {}
}

interface ThemeState {
  selectedTheme: SelectedTheme;
  setSelectedTheme: (theme: SelectedTheme) => void;
}

const _useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      selectedTheme: 'system',
      setSelectedTheme: (selectedTheme) => {
        applyUniwindTheme(selectedTheme);
        set({ selectedTheme });
      },
    }),
    {
      name: STORAGE_KEYS.SELECTED_THEME,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ selectedTheme: state.selectedTheme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyUniwindTheme(state.selectedTheme);
      },
    },
  ),
);

export const useThemeStore = _useThemeStore;

export function loadSelectedTheme(): SelectedTheme {
  const savedTheme = _useThemeStore.getState().selectedTheme;
  applyUniwindTheme(savedTheme);
  return savedTheme;
}
