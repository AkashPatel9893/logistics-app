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
    <AppView className="mt-6 px-5">
      <AppText accessibilityRole="header" className="mb-3 text-[19px] font-bold text-foreground">
        How it works
      </AppText>
      <AppView className="gap-3.5 rounded-[20px] border border-divider bg-surface p-4">
        {STEPS.map((step, index) => (
          <AppView key={step.title} className="flex-row items-start">
            <AppView center className="mr-3 size-9 rounded-full bg-brand-tint">
              <Icon name={step.icon} size={16} tone="brand" />
            </AppView>
            <AppView className="flex-1">
              <AppText className="text-[14px] font-bold text-foreground">
                {index + 1}. {step.title}
              </AppText>
              <AppText className="mt-0.5 text-[12px] leading-[17px] text-muted">
                {step.body}
              </AppText>
            </AppView>
          </AppView>
        ))}
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
    <AppView className="mt-6">
      <AppText
        accessibilityRole="header"
        className="mb-3 px-5 text-[19px] font-bold text-foreground"
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
            className="w-[168px] rounded-[18px] border border-divider bg-surface p-3"
          >
            <AppView center className="mb-2 size-8 rounded-full bg-brand-tint">
              <Icon name="mappin" size={14} tone="brand" />
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
