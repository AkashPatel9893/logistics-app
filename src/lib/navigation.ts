import type { useRouter as useExpoRouter } from 'expo-router';

export {
  DarkTheme,
  DefaultTheme,
  ErrorBoundary,
  Redirect,
  Stack,
  Tabs,
  ThemeProvider,
  useFocusEffect,
  useGlobalSearchParams,
  useIsFocused,
  useLocalSearchParams,
  useNavigation,
  usePathname,
  useRouter,
  useSegments,
  type Href,
  type Theme,
} from 'expo-router';

/** Pops the current screen, or lands on home when the app opened directly onto this route. */
export function goBack(router: ReturnType<typeof useExpoRouter>): void {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
