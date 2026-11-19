import { useUniwind } from 'uniwind';

import { useThemeColors } from '@/hooks/use-theme-color';
import { DarkTheme, DefaultTheme, type Theme } from '@/lib/navigation';

/** Google Maps night style: dark roads and land, readable labels, muted water and parks. */
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1d29' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa0b5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d29' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2b3044' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8890a8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#173226' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3147' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1d29' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4160' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#242840' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b3a' }] },
];

/** React Navigation theme built from the same Uniwind CSS tokens as the rest of the UI. */
export function useThemeConfig(): Theme {
  const { theme } = useUniwind();
  const [brand, background, surface, foreground, border] = useThemeColors([
    'brand',
    'background',
    'surface',
    'foreground',
    'border',
  ] as const);

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
}
