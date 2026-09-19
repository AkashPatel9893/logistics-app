import '@/global.css';

import { Stack, ThemeProvider } from 'expo-router';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, useThemeConfig } from '@/components/ui';
import { hydrateAuth } from '@/features/auth/use-auth-store';
import { loadSelectedTheme } from '@/hooks/use-selected-theme';
import { APIProvider } from '@/lib/api';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

loadSelectedTheme();
hydrateAuth();

export default function RootLayout() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="select-drop-address" options={{ headerShown: false }} />
        <Stack.Screen name="select-location-map" options={{ headerShown: false }} />
        <Stack.Screen name="trip-confirmation" options={{ headerShown: false }} />
        <Stack.Screen name="order-tracking" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className={`flex-1 ${theme.dark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <FocusAwareStatusBar style={theme.dark ? 'light' : 'dark'} />
            {children}
          </APIProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
