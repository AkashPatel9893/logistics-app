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

export function goBack(router: ReturnType<typeof useExpoRouter>): void {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
