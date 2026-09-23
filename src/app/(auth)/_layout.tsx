import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function AuthLayout() {
  const isSignedIn = useAuthStore.use.status() === 'signIn';
  const user = useAuthStore.use.user();
  const isOnboarded = user?.isOnboarded === true;
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  // If signed in AND completed onboarding, redirect to /home
  if (isSignedIn && isOnboarded) {
    return <Redirect href="/home" />;
  }

  // If signed in BUT NOT onboarded yet, must complete onboarding
  if (isSignedIn && !isOnboarded && currentRoute !== 'onboarding') {
    return <Redirect href="/onboarding" />;
  }

  // If NOT signed in and trying to access /onboarding, redirect to login
  if (!isSignedIn && currentRoute === 'onboarding') {
    return <Redirect href="/" />;
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
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
