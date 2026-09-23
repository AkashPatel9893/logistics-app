import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useStackAnimation } from '@/hooks/use-stack-animation';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function AuthLayout() {
  const isSignedIn = useAuthStore((state) => state.status === 'signIn');
  const isOnboarded = useAuthStore((state) => state.user?.isOnboarded === true);
  const isOnOnboarding = useSegments().at(-1) === 'onboarding';
  const animation = useStackAnimation();

  if (isSignedIn && isOnboarded) return <Redirect href="/home" />;
  // Signed in but no profile yet: onboarding is mandatory.
  if (isSignedIn && !isOnOnboarding) return <Redirect href="/onboarding" />;
  if (!isSignedIn && isOnOnboarding) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
