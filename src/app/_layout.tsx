import '@/global.css';

import { Stack, ThemeProvider } from 'expo-router';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useThemeConfig } from '@/components/ui';
import { LocationPromptHost } from '@/features/trip/location-prompt';
import { hydrateAuth } from '@/features/auth/use-auth-store';
import { useStackAnimation } from '@/hooks/use-stack-animation';
import { loadSelectedTheme } from '@/hooks/use-selected-theme';
import { APIProvider } from '@/lib/api';

export { ErrorBoundary } from 'expo-router';

loadSelectedTheme();
hydrateAuth();

function Providers({ children }: { children: ReactNode }) {
  const navigationTheme = useThemeConfig();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <APIProvider>
            {children}
            <LocationPromptHost />
          </APIProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const animation = useStackAnimation();

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false, animation }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="location-select" />
        <Stack.Screen name="select-location-map" />
        <Stack.Screen name="add-stops" />
        <Stack.Screen name="trip-confirmation" />
        <Stack.Screen name="review-booking" />
        <Stack.Screen name="offers" />
        <Stack.Screen name="order-tracking" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="support" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="track/[token]" />
      </Stack>
    </Providers>
  );
}
