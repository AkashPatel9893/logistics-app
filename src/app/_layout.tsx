import '@/global.css';

import type { ReactNode } from 'react';

import { AppBottomSheetProvider, AppKeyboardProvider, AppSafeAreaProvider } from '@/components/ui';
import { useThemeConfig } from '@/config';
import { PushNotificationHost } from '@/features/notifications/push-notification-host';
import { LocationPromptHost } from '@/features/trip/location-prompt';
import { loadSelectedTheme } from '@/hooks/use-selected-theme';
import { useStackAnimation } from '@/hooks/use-stack-animation';
import { GestureHandlerRootView } from '@/lib/gesture';
import { Stack, ThemeProvider } from '@/lib/navigation';
import { APIProvider } from '@/queries';
import { hydrateAuth } from '@/stores';

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
        <Stack.Screen name="saved-addresses" />
        <Stack.Screen name="track/[token]" />
      </Stack>
    </Providers>
  );
}
