import { useCSSVariable } from 'uniwind';

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

const FALLBACK_COLOR = '#737373';

function toColor(value: string | number | undefined): string {
  return typeof value === 'string' && value.length > 0 ? value : FALLBACK_COLOR;
}

export function useThemeColor(name: ThemeColor): string {
  return toColor(useCSSVariable(`--color-${name}`));
}

export function useThemeColors<const T extends readonly ThemeColor[]>(
  names: T,
): { [K in keyof T]: string } {
  const values = useCSSVariable(names.map((name) => `--color-${name}`)) as (
    string | number | undefined
  )[];
  return values.map(toColor) as { [K in keyof T]: string };
}
