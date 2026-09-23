import { useCSSVariable } from 'uniwind';

/** Semantic color tokens defined in `src/global.css`. */
export type ThemeColor =
  | 'brand'
  | 'brand-foreground'
  | 'brand-soft'
  | 'brand-tint'
  | 'brand-border'
  | 'accent'
  | 'brand-strong'
  | 'background'
  | 'grouped'
  | 'canvas'
  | 'surface'
  | 'surface-muted'
  | 'thumb'
  | 'search-field'
  | 'inverse'
  | 'inverse-foreground'
  | 'promo'
  | 'promo-green'
  | 'promo-red-soft'
  | 'promo-violet-soft'
  | 'foreground'
  | 'foreground-emphasis'
  | 'foreground-secondary'
  | 'foreground-tertiary'
  | 'muted'
  | 'subtle'
  | 'icon'
  | 'icon-strong'
  | 'icon-subtle'
  | 'icon-faint'
  | 'border'
  | 'border-strong'
  | 'divider'
  | 'pickup'
  | 'success'
  | 'error'
  | 'danger'
  | 'danger-soft'
  | 'danger-border'
  | 'avatar'
  | 'avatar-border'
  | 'avatar-foreground';

// Only used before Uniwind has resolved variables (first frame / tests).
const FALLBACK_COLOR = '#737373';

function toColor(value: string | number | undefined): string {
  return typeof value === 'string' && value.length > 0 ? value : FALLBACK_COLOR;
}

/**
 * Resolves a theme token to a color string for props that can't take a
 * className (icon colors, map layers, native controls). Re-renders on theme change.
 */
export function useThemeColor(name: ThemeColor): string {
  return toColor(useCSSVariable(`--color-${name}`));
}

/** Resolves several theme tokens at once, in the order given. */
export function useThemeColors<const T extends readonly ThemeColor[]>(
  names: T,
): { [K in keyof T]: string } {
  const values = useCSSVariable(names.map((name) => `--color-${name}`)) as (
    string | number | undefined
  )[];
  return values.map(toColor) as { [K in keyof T]: string };
}
