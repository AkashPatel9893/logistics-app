import { Tabs, useRouter, useSegments } from 'expo-router';

import { AppView } from '@/components/ui';
import { FloatingBottomNav } from '@/features/home/components/floating-bottom-nav';
import type { HomeTab } from '@/features/home/types';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const activeTab = (segments[segments.length - 1] as HomeTab) ?? 'home';

  const handleTabChange = (tab: HomeTab) => {
    if (tab === activeTab) return;
    router.navigate(`/${tab}`);
  };

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
