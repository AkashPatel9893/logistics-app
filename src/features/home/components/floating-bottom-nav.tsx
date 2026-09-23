import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { HomeTab } from '../types';

export interface FloatingBottomNavProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
}

export function FloatingBottomNav({ activeTab, onTabChange }: FloatingBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppView
      pointerEvents="box-none"
      className="absolute left-6 right-6 z-30"
      style={{ bottom: Math.max(insets.bottom, 12) + 6 }}
    >
      <AppView
        className="w-full h-[68px] bg-white/95 dark:bg-neutral-900/95 rounded-full flex-row items-center justify-around px-3 border border-neutral-100 dark:border-neutral-800"
        style={styles.dockShadow}
      >
        {/* Tab 1: Home */}
        <AppPressable
          onPress={() => onTabChange('home')}
          className={cn(
            'flex-1 items-center justify-center h-12 rounded-full transition-all active:scale-95',
            activeTab === 'home' && 'bg-neutral-100 dark:bg-neutral-800',
          )}
        >
          <Icon
            name={activeTab === 'home' ? 'house.fill' : 'house'}
            size={20}
            color={activeTab === 'home' ? '#FF5500' : '#4B5563'}
          />
          <AppText
            className={cn(
              'text-[11px] font-semibold mt-0.5',
              activeTab === 'home' ? 'text-[#FF5500]' : 'text-neutral-700 dark:text-neutral-300',
            )}
          >
            Home
          </AppText>
        </AppPressable>

        {/* Tab 2: Orders */}
        <AppPressable
          onPress={() => onTabChange('orders')}
          className={cn(
            'flex-1 items-center justify-center h-12 rounded-full transition-all active:scale-95',
            activeTab === 'orders' && 'bg-neutral-100 dark:bg-neutral-800',
          )}
        >
          <Icon name="box.truck" size={20} color={activeTab === 'orders' ? '#FF5500' : '#262626'} />
          <AppText
            className={cn(
              'text-[11px] font-medium mt-0.5',
              activeTab === 'orders'
                ? 'text-[#FF5500] font-semibold'
                : 'text-neutral-800 dark:text-neutral-200',
            )}
          >
            Orders
          </AppText>
        </AppPressable>

        {/* Tab 3: Account */}
        <AppPressable
          onPress={() => onTabChange('account')}
          className={cn(
            'flex-1 items-center justify-center h-12 rounded-full transition-all active:scale-95',
            activeTab === 'account' && 'bg-neutral-100 dark:bg-neutral-800',
          )}
        >
          <Icon
            name="person.fill"
            size={20}
            color={activeTab === 'account' ? '#FF5500' : '#262626'}
          />
          <AppText
            className={cn(
              'text-[11px] font-medium mt-0.5',
              activeTab === 'account'
                ? 'text-[#FF5500] font-semibold'
                : 'text-neutral-800 dark:text-neutral-200',
            )}
          >
            Account
          </AppText>
        </AppPressable>
      </AppView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  dockShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
});
