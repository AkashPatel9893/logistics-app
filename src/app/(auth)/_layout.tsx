import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function AuthLayout() {
  const isSignedIn = useAuthStore.use.status() === 'signIn';

  if (isSignedIn) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
