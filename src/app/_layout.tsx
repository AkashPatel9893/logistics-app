import '@/global.css';

import type { ReactNode } from 'react';

import { AppBottomSheetProvider, AppKeyboardProvider, AppSafeAreaProvider } from '@/components/ui';
import { useThemeConfig } from '@/config';
import { PushNotificationHost } from '@/features/notifications/push-notification-host';
import { LocationPromptHost } from '@/features/trip/location-prompt';
import { useScreenTransitions } from '@/hooks/use-stack-animation';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GestureHandlerRootView } from '@/lib/gesture';
import { Stack, ThemeProvider } from '@/lib/navigation';
import { APIProvider } from '@/queries';
import { hydrateAuth } from '@/stores';
import { loadSelectedTheme } from '@/stores/theme-store';

export { ErrorBoundary } from '@/lib/navigation';

loadSelectedTheme();
hydrateAuth();

function Providers({ children }: { children: ReactNode }) {
  const navigationTheme = useThemeConfig();

  return (
    <GestureHandlerRootView className="flex-1">
      <AppKeyboardProvider>
        <AppSafeAreaProvider>
          <AppBottomSheetProvider>
            <ThemeProvider value={navigationTheme}>
              <APIProvider>
                {children}
                <LocationPromptHost />
                <PushNotificationHost />
              </APIProvider>
            </ThemeProvider>
          </AppBottomSheetProvider>
        </AppSafeAreaProvider>
      </AppKeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const transitions = useScreenTransitions();
  const backgroundColor = useThemeColor('background');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: transitions.push,
        animationDuration: transitions.animationDuration,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="(auth)" options={{ animation: transitions.fade }} />
      <Stack.Screen name="(tabs)" options={{ animation: transitions.fade }} />
      <Stack.Screen name="location-select" options={{ animation: transitions.modal }} />
      <Stack.Screen name="select-location-map" options={{ animation: transitions.map }} />
      <Stack.Screen name="add-stops" options={{ animation: transitions.map }} />
      <Stack.Screen name="trip-confirmation" />
      <Stack.Screen name="review-booking" />
      <Stack.Screen name="offers" options={{ animation: transitions.modal }} />
      <Stack.Screen name="order-tracking" options={{ animation: transitions.tracking }} />
      <Stack.Screen name="order-chat" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="support" />
      <Stack.Screen name="support-ticket" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="saved-addresses" />
      <Stack.Screen name="track/[token]" options={{ animation: transitions.modal }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
