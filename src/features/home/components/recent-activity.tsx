import { AppPressable, AppText, AppView, Divider, Icon, type IconName } from '@/components/ui';
import { ORDER_STAGE_LABEL } from '@/features/orders/order-stage-labels';
import type { DisplayAddress } from '@/features/trip/hooks/use-address-search';
import type { Order } from '@/lib/api/models';

export interface RecentActivityProps {
  /** Places the customer recently delivered to, newest first. */
  recentDrops: DisplayAddress[];
  /** The customer's latest finished order, if any. */
  lastOrder: Order | undefined;
  onSelectDrop: (drop: DisplayAddress) => void;
  onOpenOrder: (order: Order) => void;
  onViewAllOrders: () => void;
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

/** Home shortcuts: send again to a recent place, or reopen the last order. Hidden when empty. */
export function RecentActivity({
  recentDrops,
  lastOrder,
  onSelectDrop,
  onOpenOrder,
  onViewAllOrders,
}: RecentActivityProps) {
  // A first-time user has no history: explain the three steps instead of leaving the space empty.
  if (recentDrops.length === 0 && !lastOrder) return <HowItWorks />;

  return (
    <AppView className="mt-6 px-5">
      <AppView row className="mb-3 items-center justify-between">
        <AppText accessibilityRole="header" className="text-[19px] font-bold text-foreground">
          Recent
        </AppText>
        {lastOrder ? (
          <AppPressable onPress={onViewAllOrders} hitSlop={10} accessibilityLabel="View all orders">
            <AppText className="text-[13px] font-bold text-brand">All orders</AppText>
          </AppPressable>
        ) : null}
      </AppView>
      <AppView className="overflow-hidden rounded-[20px] border border-divider bg-surface">
        {recentDrops.map((drop, index) => (
          <AppView key={drop.id}>
            {index > 0 ? <Divider insetClassName="ml-[56px]" /> : null}
            <AppPressable
              onPress={() => onSelectDrop(drop)}
              accessibilityLabel={`Send to ${drop.name}`}
              className="flex-row items-center px-3.5 py-3"
            >
              <AppView center className="mr-3 size-9 rounded-full bg-surface-muted">
                <Icon name="clock" size={16} tone="icon-subtle" />
              </AppView>
              <AppView className="flex-1">
                <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                  {drop.name}
                </AppText>
                {drop.address ? (
                  <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                    {drop.address}
                  </AppText>
                ) : null}
              </AppView>
              <Icon name="chevron.right" size={14} tone="icon-subtle" />
            </AppPressable>
          </AppView>
        ))}

        {lastOrder ? (
          <>
            {recentDrops.length > 0 ? <Divider insetClassName="ml-[56px]" /> : null}
            <AppPressable
              onPress={() => onOpenOrder(lastOrder)}
              accessibilityLabel={`Last order ${lastOrder.number}, ${ORDER_STAGE_LABEL[lastOrder.status]}`}
              className="flex-row items-center px-3.5 py-3"
            >
              <AppView center className="mr-3 size-9 rounded-full bg-brand-tint">
                <Icon name="box.truck.fill" size={16} tone="brand" />
              </AppView>
              <AppView className="flex-1">
                <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                  Last order · #{lastOrder.number}
                </AppText>
                <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                  {ORDER_STAGE_LABEL[lastOrder.status]}
                  {lastOrder.pricing.payable > 0 ? ` · ₹${lastOrder.pricing.payable}` : ''}
                </AppText>
              </AppView>
              <Icon name="chevron.right" size={14} tone="icon-subtle" />
            </AppPressable>
          </>
        ) : null}
      </AppView>
    </AppView>
  );
}
