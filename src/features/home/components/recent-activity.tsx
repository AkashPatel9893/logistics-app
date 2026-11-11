import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Icon,
  type IconName,
} from '@/components/ui';
import type { DisplayAddress } from '@/features/trip/hooks/use-address-search';

export interface RecentActivityProps {
  /** Places the customer recently delivered to, newest first. */
  recentDrops: DisplayAddress[];
  onSelectDrop: (drop: DisplayAddress) => void;
}

const STEPS: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'mappin',
    title: 'Set pickup and drop',
    body: 'Search an address or pin it on the map, and add who to contact.',
  },
  {
    icon: 'box.truck.fill',
    title: 'Choose a vehicle',
    body: 'See the price for each vehicle before you book.',
  },
  {
    icon: 'checkmark.circle.fill',
    title: 'Track and share the code',
    body: 'Follow your driver live. Give the pickup and delivery codes only at handover.',
  },
];

function HowItWorks() {
  return (
    <AppView className="mt-7 px-5">
      <AppText accessibilityRole="header" className="mb-3.5 text-[20px] font-bold text-foreground">
        How it works
      </AppText>
      <AppView className="rounded-[24px] border border-border/70 bg-surface px-4 pb-1 pt-4">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <AppView key={step.title} className="flex-row">
              {/* Numbered badge with a rail down to the next step. */}
              <AppView className="mr-3.5 items-center">
                <AppView center className="size-10 rounded-[14px] bg-brand-soft">
                  <Icon name={step.icon} size={18} tone="brand" />
                </AppView>
                {isLast ? null : <AppView className="my-1.5 w-0.5 flex-1 rounded-full bg-border" />}
              </AppView>
              <AppView className={isLast ? 'flex-1 pb-4' : 'flex-1 pb-5'}>
                <AppText className="text-[11px] font-bold uppercase tracking-wider text-brand-strong">
                  Step {index + 1}
                </AppText>
                <AppText className="mt-0.5 text-[15px] font-bold text-foreground">
                  {step.title}
                </AppText>
                <AppText className="mt-1 text-[12.5px] leading-[18px] text-muted">
                  {step.body}
                </AppText>
              </AppView>
            </AppView>
          );
        })}
      </AppView>
    </AppView>
  );
}

/**
 * One-tap rebooking to recent drop places. Past orders live in the Orders tab, so they are not
 * repeated here. A first-time customer sees how booking works instead.
 */
export function RecentActivity({ recentDrops, onSelectDrop }: RecentActivityProps) {
  if (recentDrops.length === 0) return <HowItWorks />;

  return (
    <AppView className="mt-7">
      <AppText
        accessibilityRole="header"
        className="mb-3.5 px-5 text-[20px] font-bold text-foreground"
      >
        Send again
      </AppText>
      <AppScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2.5 px-5"
      >
        {recentDrops.map((drop) => (
          <AppPressable
            key={drop.id}
            onPress={() => onSelectDrop(drop)}
            accessibilityLabel={`Send to ${drop.name}`}
            className="w-[176px] rounded-[22px] border border-border/70 bg-surface p-3.5"
          >
            <AppView row className="mb-2.5 items-center justify-between">
              <AppView center className="size-9 rounded-[12px] bg-brand-soft">
                <Icon name="mappin" size={16} tone="brand" />
              </AppView>
              <Icon name="arrow.right" size={14} tone="icon-subtle" />
            </AppView>
            <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
              {drop.name}
            </AppText>
            {drop.address ? (
              <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                {drop.address}
              </AppText>
            ) : null}
          </AppPressable>
        ))}
      </AppScrollView>
    </AppView>
  );
}
