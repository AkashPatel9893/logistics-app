import { Redirect, Tabs, useRouter, useSegments } from 'expo-router';

import { FloatingTabBar, FloatingTabBarSpacer, type TabName } from '@/components/floating-tab-bar';
import { AppView } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';

const TAB_NAMES: readonly TabName[] = ['home', 'orders', 'account'];

function isTabName(value: string | undefined): value is TabName {
  return TAB_NAMES.includes(value as TabName);
}

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isSignedIn = useAuthStore((state) => state.status === 'signIn');
  const isOnboarded = useAuthStore((state) => state.user?.isOnboarded === true);
  const lastSegment = segments.at(-1);
  const activeTab: TabName = isTabName(lastSegment) ? lastSegment : 'home';

  if (!isSignedIn) return <Redirect href="/" />;
  if (!isOnboarded) return <Redirect href="/onboarding" />;

  return (
    <AppView className="flex-1">
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="orders" />
        <Tabs.Screen name="account" />
      </Tabs>
      <FloatingTabBarSpacer />
      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== activeTab) router.navigate(`/${tab}`);
        }}
      />
    </AppView>
  );
}
