import type { ComponentProps } from 'react';

import { FloatingTabBar, type TabName } from '@/components/floating-tab-bar';
import { AppView } from '@/components/ui';
import { ActiveRidesDock } from '@/features/orders/components/active-rides-dock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { haptics } from '@/lib/haptics';
import { DURATION, useReducedMotion } from '@/lib/motion';
import { NativeEasing } from '@/lib/native';
import { Redirect, Tabs, useRouter, useSegments } from '@/lib/navigation';
import { useAuthStore } from '@/stores';

const TAB_NAMES: readonly TabName[] = ['home', 'orders', 'account'];
const TAB_SHIFT_PX = 18;

type TabScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Tabs>['screenOptions']>,
  (...args: any[]) => any
>;

const tabSceneStyleInterpolator: TabScreenOptions['sceneStyleInterpolator'] = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-TAB_SHIFT_PX, 0, TAB_SHIFT_PX],
        }),
      },
    ],
  },
});

const tabTransitionSpec: TabScreenOptions['transitionSpec'] = {
  animation: 'timing',
  config: {
    duration: DURATION.tab,
    easing: NativeEasing.out(NativeEasing.cubic),
  },
};

function isTabName(value: string | undefined): value is TabName {
  return TAB_NAMES.includes(value as TabName);
}

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const reducedMotion = useReducedMotion();
  const backgroundColor = useThemeColor('background');
  const isSignedIn = useAuthStore((state) => state.status === 'signIn');
  const isOnboarded = useAuthStore((state) => state.user?.isOnboarded === true);
  const lastSegment = segments.at(-1);
  const activeTab: TabName = isTabName(lastSegment) ? lastSegment : 'home';

  if (!isSignedIn) return <Redirect href="/" />;
  if (!isOnboarded) return <Redirect href="/onboarding" />;

  return (
    <AppView className="flex-1 bg-background">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor },
          ...(reducedMotion
            ? { animation: 'fade' }
            : {
                sceneStyleInterpolator: tabSceneStyleInterpolator,
                transitionSpec: tabTransitionSpec,
              }),
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="orders" />
        <Tabs.Screen name="account" />
      </Tabs>
      <ActiveRidesDock />
      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== activeTab) {
            haptics.selection();
            router.navigate(`/${tab}`);
          }
        }}
      />
    </AppView>
  );
}
