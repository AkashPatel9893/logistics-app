import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, Icon, type IconName } from '@/components/ui';
import type { ThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

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
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 6;
}

/** Reserves exactly the space the floating bar covers, so tab content never slips under it. */
export function FloatingTabBarSpacer() {
  const bottom = useDockBottom();
  return <AppView style={{ height: bottom + DOCK_HEIGHT + DOCK_GAP }} />;
}

interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

function TabButton({ tab, isActive, onPress }: TabButtonProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      pressScale={0.94}
      className={cn(
        'h-12 flex-1 items-center justify-center rounded-full',
        isActive && 'bg-surface-muted',
      )}
    >
      <Icon
        name={isActive ? tab.activeIcon : tab.icon}
        size={20}
        tone={isActive ? 'brand' : tab.inactiveIconTone}
      />
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

  return (
    <AppView
      pointerEvents="box-none"
      accessibilityRole="tablist"
      className="absolute left-6 right-6 z-30"
      style={{ bottom }}
    >
      <AppView
        row
        className="h-[68px] w-full justify-around rounded-full border border-divider bg-surface/95 px-3"
        style={styles.dockShadow}
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => onTabChange(tab.name)}
          />
        ))}
      </AppView>
    </AppView>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  dockShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
});
