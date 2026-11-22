import { useEffect, useRef, useState } from 'react';

import {
  AnimatedView,
  AppPressable,
  AppText,
  AppView,
  Icon,
  useAppSafeAreaInsets,
  type IconName,
} from '@/components/ui';
import type { ThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';
import {
  DURATION,
  ENTER_EASE_OUT,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from '@/lib/motion';

export type TabName = 'home' | 'orders' | 'account';

interface TabConfig {
  name: TabName;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  inactiveIconTone: ThemeColor;
  inactiveLabelClassName: string;
}

const TABS: readonly TabConfig[] = [
  {
    name: 'home',
    label: 'Home',
    icon: 'house',
    activeIcon: 'house.fill',
    inactiveIconTone: 'icon-strong',
    inactiveLabelClassName: 'font-semibold text-foreground-secondary',
  },
  {
    name: 'orders',
    label: 'Orders',
    icon: 'box.truck',
    activeIcon: 'box.truck',
    inactiveIconTone: 'foreground-emphasis',
    inactiveLabelClassName: 'font-medium text-foreground-emphasis',
  },
  {
    name: 'account',
    label: 'Account',
    icon: 'person.fill',
    activeIcon: 'person.fill',
    inactiveIconTone: 'foreground-emphasis',
    inactiveLabelClassName: 'font-medium text-foreground-emphasis',
  },
];

const DOCK_HEIGHT = 68;
const DOCK_GAP = 8;

function useDockBottom() {
  const insets = useAppSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 6;
}

export function useFloatingTabBarInset() {
  return useDockBottom() + DOCK_HEIGHT + DOCK_GAP;
}

interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  showStaticPill: boolean;
  onPress: () => void;
}

function TabButton({ tab, isActive, showStaticPill, onPress }: TabButtonProps) {
  const reducedMotion = useReducedMotion();
  const iconScale = useSharedValue(isActive ? 1.06 : 1);

  useEffect(() => {
    const target = isActive ? 1.06 : 1;
    if (reducedMotion) {
      iconScale.set(target);
      return;
    }
    iconScale.set(withTiming(target, { duration: DURATION.small, easing: ENTER_EASE_OUT }));
  }, [isActive, reducedMotion, iconScale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.get() }],
  }));

  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      pressScale={0.94}
      className={cn(
        'h-12 flex-1 items-center justify-center rounded-full',
        showStaticPill && isActive && 'bg-surface-muted',
      )}
    >
      <AnimatedView style={iconStyle}>
        <Icon
          name={isActive ? tab.activeIcon : tab.icon}
          size={20}
          tone={isActive ? 'brand' : tab.inactiveIconTone}
        />
      </AnimatedView>
      <AppText
        className={cn(
          'mt-0.5 text-[11px]',
          isActive ? 'font-semibold text-brand' : tab.inactiveLabelClassName,
        )}
      >
        {tab.label}
      </AppText>
    </AppPressable>
  );
}

export interface FloatingTabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export function FloatingTabBar({ activeTab, onTabChange }: FloatingTabBarProps) {
  const bottom = useDockBottom();
  const reducedMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.name === activeTab),
  );
  const [rowWidth, setRowWidth] = useState(0);
  const slotWidth = rowWidth > 0 ? rowWidth / TABS.length : 0;
  const indicatorX = useSharedValue(0);
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (slotWidth <= 0) return;
    const target = activeIndex * slotWidth;
    if (!hasPositioned.current || reducedMotion) {
      hasPositioned.current = true;
      indicatorX.set(target);
      return;
    }
    indicatorX.set(withSpring(target, { damping: 24, stiffness: 280, mass: 0.75 }));
  }, [activeIndex, slotWidth, reducedMotion, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
  }));

  return (
    <AppView
      pointerEvents="box-none"
      accessibilityRole="tablist"
      className="absolute left-6 right-6 z-30"
      style={{ bottom }}
    >
      <AppView className="h-[68px] w-full justify-center rounded-full border border-divider bg-surface px-3 shadow-dock">
        <AppView
          row
          className="relative flex-1 items-center"
          onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        >
          {slotWidth > 0 ? (
            <AnimatedView
              pointerEvents="none"
              className="absolute left-0 h-12 rounded-full bg-surface-muted"
              style={[{ width: slotWidth }, indicatorStyle]}
            />
          ) : null}
          {TABS.map((tab) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeTab === tab.name}
              showStaticPill={slotWidth === 0}
              onPress={() => onTabChange(tab.name)}
            />
          ))}
        </AppView>
      </AppView>
    </AppView>
  );
}
