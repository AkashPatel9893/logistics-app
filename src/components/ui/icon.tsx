import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Platform } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialCommunityIconsName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type AndroidGlyph =
  | { set: 'ionicons'; name: IoniconsName }
  | { set: 'material-community'; name: MaterialCommunityIconsName };

/**
 * SF Symbol name -> Android glyph. `name` is always an SF Symbol name (the
 * vocabulary already used throughout this app's mock data and screens); this
 * registry is the single place that maps it to an Android-safe equivalent.
 * Add new entries here instead of hand-rolling another `Platform.OS` branch.
 */
const ANDROID_ICON_REGISTRY: Record<string, AndroidGlyph> = {
  banknote: { set: 'ionicons', name: 'cash-outline' },
  iphone: { set: 'ionicons', name: 'phone-portrait-outline' },
  creditcard: { set: 'ionicons', name: 'card-outline' },
  'wallet.pass.fill': { set: 'ionicons', name: 'wallet' },
  'checkmark.circle.fill': { set: 'ionicons', name: 'checkmark-circle' },
  'box.truck.fill': { set: 'material-community', name: 'truck' },
  'box.truck': { set: 'material-community', name: 'truck-outline' },
  'arrow.right': { set: 'ionicons', name: 'arrow-forward' },
  'slider.horizontal.3': { set: 'ionicons', name: 'options-outline' },
  magnifyingglass: { set: 'ionicons', name: 'search' },
  'mic.fill': { set: 'ionicons', name: 'mic' },
  mic: { set: 'ionicons', name: 'mic-outline' },
  'xmark.circle.fill': { set: 'ionicons', name: 'close-circle' },
  pencil: { set: 'ionicons', name: 'pencil' },
  location: { set: 'ionicons', name: 'location-outline' },
  'location.fill': { set: 'ionicons', name: 'location' },
  plus: { set: 'ionicons', name: 'add' },
  'star.fill': { set: 'ionicons', name: 'star' },
  person: { set: 'ionicons', name: 'person-outline' },
  'person.fill': { set: 'ionicons', name: 'person' },
  mappin: { set: 'material-community', name: 'map-marker' },
  'mappin.circle.fill': { set: 'material-community', name: 'map-marker' },
  'shippingbox.fill': { set: 'material-community', name: 'package-variant' },
  clock: { set: 'ionicons', name: 'time-outline' },
  'chevron.right': { set: 'ionicons', name: 'chevron-forward' },
  'chevron.up': { set: 'ionicons', name: 'chevron-up' },
  'chevron.left': { set: 'ionicons', name: 'chevron-back' },
  'phone.fill': { set: 'ionicons', name: 'call' },
  house: { set: 'ionicons', name: 'home-outline' },
  'house.fill': { set: 'ionicons', name: 'home' },
  briefcase: { set: 'ionicons', name: 'briefcase-outline' },
  heart: { set: 'ionicons', name: 'heart-outline' },
  'heart.fill': { set: 'ionicons', name: 'heart' },
  percent: { set: 'material-community', name: 'percent' },
  'gift.fill': { set: 'ionicons', name: 'gift' },
  'checkmark.shield.fill': { set: 'ionicons', name: 'shield-checkmark' },
  'questionmark.circle': { set: 'ionicons', name: 'help-circle-outline' },
};

export type IconName = keyof typeof ANDROID_ICON_REGISTRY;

export interface IconProps {
  /** SF Symbol name. Rendered via `SymbolView` on iOS and mapped to a native
   * Android glyph via `ANDROID_ICON_REGISTRY` everywhere else. */
  name: IconName;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
}

export function Icon({ name, size = 20, color = '#000000', weight }: IconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name as SymbolViewProps['name']}
        size={size}
        tintColor={color}
        weight={weight}
      />
    );
  }

  const glyph = ANDROID_ICON_REGISTRY[name];
  if (!glyph) {
    if (__DEV__) {
      console.warn(`Icon: no Android mapping registered for SF Symbol "${name}"`);
    }
    return null;
  }

  if (glyph.set === 'material-community') {
    return <MaterialCommunityIcons name={glyph.name} size={size} color={color} />;
  }
  return <Ionicons name={glyph.name} size={size} color={color} />;
}
