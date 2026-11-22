import {
  AppPressable,
  AppSpinner,
  AppText,
  AppView,
  EmptyState,
  Icon,
  type IconName,
} from '@/components/ui';
import { cn } from '@/lib/cn';

export interface QuickAction {
  key: string;
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  isActive?: boolean;
  isBusy?: boolean;
}

export function SearchQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <AppView className="mx-4 mb-3 overflow-hidden rounded-3xl border border-border/40 bg-surface shadow-quick-action">
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

export function SearchEmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <AppView className="flex-1 justify-center pb-14 pt-6">
      <EmptyState illustration="search" compact title={title} subtitle={hint} />
    </AppView>
  );
}
