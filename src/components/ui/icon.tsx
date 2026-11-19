import { createNanoIconSet } from 'react-native-nano-icons';

import { useThemeColor, type ThemeColor } from '@/hooks/use-theme-color';

import lucideGlyphMap from '../../../assets/icons/nanoicons/lucide.glyphmap.json';

const NanoIcon = createNanoIconSet(lucideGlyphMap);

type LucideIconName = keyof typeof lucideGlyphMap.i;

const ICON_REGISTRY = {
  banknote: 'banknote',
  iphone: 'smartphone',
  creditcard: 'credit-card',
  'wallet.pass.fill': 'wallet',
  'checkmark.circle.fill': 'circle-check',
  checkmark: 'check',
  'box.truck.fill': 'truck',
  'box.truck': 'truck',
  'arrow.right': 'arrow-right',
  'arrow.clockwise': 'rotate-cw',
  'slider.horizontal.3': 'sliders-horizontal',
  magnifyingglass: 'search',
  'mic.fill': 'mic',
  'xmark.circle.fill': 'circle-x',
  pencil: 'pencil',
  location: 'map-pin',
  scope: 'locate-fixed',
  star: 'star',
  'star.fill': 'star-fill',
  person: 'user',
  'person.fill': 'user',
  mappin: 'map-pin',
  'mappin.circle.fill': 'map-pin',
  'shippingbox.fill': 'package',
  clock: 'clock',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'chevron-up',
  'chevron.down': 'chevron-down',
  phone: 'phone',
  'phone.fill': 'phone',
  'envelope.fill': 'mail',
  house: 'house',
  'house.fill': 'house',
  briefcase: 'briefcase',
  heart: 'heart',
  'heart.fill': 'heart-fill',
  'storefront.fill': 'store',
  'plus.circle.fill': 'circle-plus',
  percent: 'percent',
  'gift.fill': 'gift',
  'tag.fill': 'tag',
  'checkmark.shield.fill': 'shield-check',
  'questionmark.circle': 'circle-help',
  globe: 'globe',
  'square.and.arrow.up': 'share',
  'lock.fill': 'lock',
  'message.fill': 'message-circle',
  plus: 'plus',
  'arrow.up': 'arrow-up',
  'arrow.down': 'arrow-down',
  'line.3.horizontal': 'menu',
  'arrow.up.arrow.down': 'arrow-up-down',
  'location.north.fill': 'navigation',
  'indianrupeesign.circle.fill': 'indian-rupee',
  'doc.text.fill': 'file-text',
  'hand.raised.fill': 'hand',
  'exclamationmark.bubble.fill': 'circle-alert',
  'person.2.fill': 'users',
} as const satisfies Record<string, LucideIconName>;

type LegacyIconName = keyof typeof ICON_REGISTRY;

export type IconName = LucideIconName | LegacyIconName;

export interface IconProps {
  name: IconName;
  size?: number;
  tone?: ThemeColor;
  color?: string;
  weight?:
    | 'ultraLight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';
}

function isLegacyIconName(name: IconName): name is LegacyIconName {
  return name in ICON_REGISTRY;
}

export function Icon({ name, size = 20, tone = 'foreground', color }: IconProps) {
  const themeColor = useThemeColor(tone);
  const tintColor = color ?? themeColor;
  const resolvedName: LucideIconName = isLegacyIconName(name) ? ICON_REGISTRY[name] : name;

  return <NanoIcon name={resolvedName} size={size} color={tintColor} />;
}
