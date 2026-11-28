import { useEffect, type ComponentProps } from 'react';

import { FloatingTabBar, type TabName } from '@/components/floating-tab-bar';
import { AppView } from '@/components/ui';
import { ActiveRidesDock } from '@/features/orders/components/active-rides-dock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { haptics } from '@/lib/haptics';
import { DURATION, useReducedMotion } from '@/lib/motion';
import { NativeEasing } from '@/lib/native';
import { Redirect, Tabs, useRouter, useSegments } from '@/lib/navigation';
import { isActiveOrder, useOrders } from '@/queries';
import { useAuthStore } from '@/stores';

/** User id for which we already ran the cold-launch active-order resume (one-shot per app session). */
let resumedOrderForUserId: string | null = null;

/**
 * Cold-launch resume: if the signed-in user has exactly one active order, open its live tracking
 * screen once on launch (keeping Home in the back stack). With 2+ orders, stay on Home so
 * ActiveRidesDock lets them choose.
 */
function ResumeActiveOrder({ userId }: { userId: string }) {
  const router = useRouter();
  const segments = useSegments();
  const { data: orders, isFetched } = useOrders();
  const onTabs = segments[0] === '(tabs)';

  useEffect(() => {
    if (resumedOrderForUserId === userId || !isFetched) return;
    resumedOrderForUserId = userId;
    if (!onTabs) return;
    const active = (orders ?? []).filter(isActiveOrder);
    if (active.length === 1) {
      router.push({ pathname: '/order-tracking', params: { orderId: active[0].id } });
    }
  }, [isFetched, onTabs, orders, router, userId]);

  return null;
}

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
  const userId = useAuthStore((state) => state.user?.id);
  const lastSegment = segments.at(-1);
  const activeTab: TabName = isTabName(lastSegment) ? lastSegment : 'home';

  if (!isSignedIn) return <Redirect href="/" />;
  if (!isOnboarded) return <Redirect href="/onboarding" />;

  return (
    <AppView className="flex-1 bg-background">
      {userId ? <ResumeActiveOrder userId={userId} /> : null}
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
