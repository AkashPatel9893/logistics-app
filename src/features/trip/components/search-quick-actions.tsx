import { StyleSheet } from 'react-native';

import { AppPressable, AppSpinner, AppText, AppView, Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface QuickAction {
  key: string;
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Highlighted (e.g. the saved-addresses filter is on). */
  isActive?: boolean;
  isBusy?: boolean;
}

/** Shortcuts under the search field: current location, pick on map, saved places. */
export function SearchQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <AppView
      style={styles.shadow}
      className="mx-4 mb-3 overflow-hidden rounded-3xl border border-border/40 bg-surface"
    >
      {actions.map((action) => (
        <AppPressable
          key={action.key}
          onPress={action.onPress}
          disabled={action.isBusy}
          pressScale={0.99}
          accessibilityRole="button"
          accessibilityLabel={`${action.title}. ${action.subtitle}`}
          accessibilityState={{ selected: action.isActive, busy: action.isBusy }}
          className="flex-row items-center px-4 py-3 active:bg-surface-muted"
        >
          <AppView
            center
            className={cn(
              'mr-3 size-10 rounded-full',
              action.isActive ? 'bg-brand' : 'bg-brand-tint',
            )}
          >
            {action.isBusy ? (
              <AppSpinner tone="brand" />
            ) : (
              <Icon
                name={action.icon}
                size={18}
                tone={action.isActive ? 'brand-foreground' : 'brand'}
              />
            )}
          </AppView>
          <AppView className="flex-1 flex-row items-center py-0.5">
            <AppView className="flex-1">
              <AppText className="text-[15px] font-semibold text-foreground">
                {action.title}
              </AppText>
              <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                {action.subtitle}
              </AppText>
            </AppView>
            <Icon name="chevron.right" size={16} tone="icon-subtle" />
          </AppView>
        </AppPressable>
      ))}
    </AppView>
  );
}

/** Shown under the shortcuts before anything is typed. */
export function SearchEmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <AppView className="items-center px-10 pt-8">
      <AppView center className="mb-4 size-16 rounded-full bg-brand-tint">
        <AppView center className="size-11 rounded-full bg-brand">
          <Icon name="magnifyingglass" size={20} tone="brand-foreground" />
        </AppView>
      </AppView>
      <AppText className="text-center text-[16px] font-bold text-foreground">{title}</AppText>
      <AppText className="mt-1.5 text-center text-[13px] leading-5 text-muted">{hint}</AppText>
    </AppView>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});
