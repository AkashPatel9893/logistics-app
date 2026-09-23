import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { useThemeColor, type ThemeColor } from '@/hooks/use-theme-color';

type AndroidGlyph =
  | { set: 'ionicons'; name: ComponentProps<typeof Ionicons>['name'] }
  | { set: 'material-community'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

/**
 * SF Symbol name → Android glyph. `name` is always an SF Symbol name; this
 * registry is the single place that maps it to an Android equivalent. Add an
 * entry here before using a new symbol — `IconName` only accepts registered keys.
 */
const ANDROID_ICON_REGISTRY = {
  banknote: { set: 'ionicons', name: 'cash-outline' },
  iphone: { set: 'ionicons', name: 'phone-portrait-outline' },
  creditcard: { set: 'ionicons', name: 'card-outline' },
  'wallet.pass.fill': { set: 'ionicons', name: 'wallet' },
  'checkmark.circle.fill': { set: 'ionicons', name: 'checkmark-circle' },
  checkmark: { set: 'ionicons', name: 'checkmark' },
  'box.truck.fill': { set: 'material-community', name: 'truck' },
  'box.truck': { set: 'material-community', name: 'truck-outline' },
  'arrow.right': { set: 'ionicons', name: 'arrow-forward' },
  'slider.horizontal.3': { set: 'ionicons', name: 'options-outline' },
  magnifyingglass: { set: 'ionicons', name: 'search' },
  'mic.fill': { set: 'ionicons', name: 'mic' },
  'xmark.circle.fill': { set: 'ionicons', name: 'close-circle' },
  pencil: { set: 'ionicons', name: 'pencil' },
  location: { set: 'ionicons', name: 'location-outline' },
  scope: { set: 'ionicons', name: 'locate' },
  star: { set: 'ionicons', name: 'star-outline' },
  'star.fill': { set: 'ionicons', name: 'star' },
  person: { set: 'ionicons', name: 'person-outline' },
  'person.fill': { set: 'ionicons', name: 'person' },
  mappin: { set: 'material-community', name: 'map-marker' },
  'mappin.circle.fill': { set: 'material-community', name: 'map-marker' },
  'shippingbox.fill': { set: 'material-community', name: 'package-variant' },
  clock: { set: 'ionicons', name: 'time-outline' },
  'chevron.right': { set: 'ionicons', name: 'chevron-forward' },
  'chevron.left': { set: 'ionicons', name: 'chevron-back' },
  'chevron.up': { set: 'ionicons', name: 'chevron-up' },
  'chevron.down': { set: 'ionicons', name: 'chevron-down' },
  phone: { set: 'ionicons', name: 'call-outline' },
  'phone.fill': { set: 'ionicons', name: 'call' },
  'envelope.fill': { set: 'ionicons', name: 'mail' },
  house: { set: 'ionicons', name: 'home-outline' },
  'house.fill': { set: 'ionicons', name: 'home' },
  briefcase: { set: 'ionicons', name: 'briefcase-outline' },
  heart: { set: 'ionicons', name: 'heart-outline' },
  'heart.fill': { set: 'ionicons', name: 'heart' },
  percent: { set: 'material-community', name: 'percent' },
  'gift.fill': { set: 'ionicons', name: 'gift' },
  'tag.fill': { set: 'ionicons', name: 'pricetag' },
  'checkmark.shield.fill': { set: 'ionicons', name: 'shield-checkmark' },
  'questionmark.circle': { set: 'ionicons', name: 'help-circle-outline' },
  globe: { set: 'ionicons', name: 'globe-outline' },
  'square.and.arrow.up': { set: 'ionicons', name: 'share-outline' },
  'lock.fill': { set: 'ionicons', name: 'lock-closed' },
} as const satisfies Record<string, AndroidGlyph>;

export type IconName = keyof typeof ANDROID_ICON_REGISTRY;

export interface IconProps {
  /** SF Symbol name; mapped to an Android glyph via the registry above. */
  name: IconName;
  size?: number;
  /** Theme token for the icon color. Ignored when `color` is set. */
  tone?: ThemeColor;
  /** Explicit color override — prefer `tone`. */
  color?: string;
  weight?: SymbolViewProps['weight'];
}

export function Icon({ name, size = 20, tone = 'foreground', color, weight }: IconProps) {
  const themeColor = useThemeColor(tone);
  const tintColor = color ?? themeColor;

  if (Platform.OS === 'ios') {
    return <SymbolView name={name} size={size} tintColor={tintColor} weight={weight} />;
  }

  const glyph: AndroidGlyph = ANDROID_ICON_REGISTRY[name];
  if (glyph.set === 'material-community') {
    return <MaterialCommunityIcons name={glyph.name} size={size} color={tintColor} />;
  }
  return <Ionicons name={glyph.name} size={size} color={tintColor} />;
}
