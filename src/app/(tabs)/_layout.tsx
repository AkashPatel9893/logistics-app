import { Redirect, Tabs, useRouter, useSegments } from 'expo-router';

import { AppView } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { FloatingBottomNav } from '@/features/home/components/floating-bottom-nav';
import type { HomeTab } from '@/features/home/types';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isSignedIn = useAuthStore.use.status() === 'signIn';
  const user = useAuthStore.use.user();
  const isOnboarded = user?.isOnboarded === true;
  const activeTab = (segments[segments.length - 1] as HomeTab) ?? 'home';

  const handleTabChange = (tab: HomeTab) => {
    if (tab === activeTab) return;
    router.navigate(`/${tab}`);
  };

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <AppView className="flex-1">
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="orders" />
        <Tabs.Screen name="account" />
      </Tabs>
      <FloatingBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </AppView>
  );
}
