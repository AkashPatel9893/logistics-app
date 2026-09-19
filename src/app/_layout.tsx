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
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="select-drop-address" />
        <Stack.Screen name="select-location-map" />
        <Stack.Screen name="trip-confirmation" />
        <Stack.Screen name="order-tracking" />
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
