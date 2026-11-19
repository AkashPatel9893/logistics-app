import {
  Alert,
  AppState,
  Keyboard,
  Linking,
  Platform,
  Share,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
  type AppStateStatus,
  type ColorValue,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type KeyboardTypeOptions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export {
  Alert,
  AppState,
  Keyboard,
  Linking,
  Platform,
  Share,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
  type AppStateStatus,
  type ColorValue,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type KeyboardTypeOptions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
};

/** Opens a URL via the OS and shows a helpful fallback alert if no handler exists. */
export function openExternalUrl(
  url: string,
  fallbackMessage: string,
  fallbackTitle = 'Unable to open',
): void {
  Linking.openURL(url).catch(() => Alert.alert(fallbackTitle, fallbackMessage));
}

/** Shares plain text using the platform share sheet, ignoring cancellations. */
export function shareText(message: string): Promise<void> {
  return Share.share({ message })
    .then(() => undefined)
    .catch(() => undefined);
}
