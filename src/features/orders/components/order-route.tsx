import { AppText, AppView, Icon } from '@/components/ui';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';

type StopKind = 'pickup' | 'stop' | 'drop';

interface RouteStop {
  kind: StopKind;
  number?: number;
  who: string;
  place: string;
}

function contactLine(contact: { name: string; phone: string } | null | undefined): string {
  return contact ? [contact.name, contact.phone].filter(Boolean).join(' · ') : '';
}

/** Pickup, every stop on the way (numbered) and the drop, in visiting order. */
function routeStops(order: Order): RouteStop[] {
  // The progress list's last entry is the final drop; the ones before it are stops on the way.
  const middle = order.stops.length > 1 ? order.stops.slice(0, -1) : [];
  return [
    { kind: 'pickup', who: contactLine(order.pickup.contact), place: order.pickup.label },
    ...middle.map((stop) => ({
      kind: 'stop' as const,
      number: stop.number,
      who: contactLine({ name: stop.contactName, phone: stop.contactPhone }),
      place: stop.label,
    })),
    { kind: 'drop', who: contactLine(order.drop.contact), place: order.drop.label },
  ];
}

function StopBadge({ kind, number }: { kind: StopKind; number?: number }) {
  if (kind === 'stop') {
    return (
      <AppView center className="size-6 rounded-full bg-slate-600">
        <AppText className="text-[11px] font-bold text-white">{number}</AppText>
      </AppView>
    );
  }
  return (
    <AppView
      center
      className={cn('size-6 rounded-full', kind === 'pickup' ? 'bg-emerald-500' : 'bg-rose-500')}
    >
      <Icon name={kind === 'pickup' ? 'arrow.up' : 'arrow.down'} size={12} color="#FFFFFF" />
    </AppView>
  );
}

export interface OrderRouteProps {
  order: Order;
  /** One line per address (cards and lists); full addresses otherwise (details). */
  compact?: boolean;
  /** Show stops on the way as one "2 STOPS" pill between pickup and drop, as history cards do. */
  collapseStops?: boolean;
}

/** The order's stops with who is at each, joined by a rail. */
export function OrderRoute({ order, compact = false, collapseStops = false }: OrderRouteProps) {
  const allStops = routeStops(order);
  const middleCount = allStops.length - 2;
  const stops = collapseStops ? [allStops[0], allStops[allStops.length - 1]] : allStops;
  return (
    <AppView>
      {stops.map((stop, index) => {
        const isLast = index === stops.length - 1;
        return (
          <AppView key={`${stop.kind}:${index}`} row>
            <AppView className="mr-3 items-center pt-0.5">
              <StopBadge kind={stop.kind} number={stop.number} />
              {isLast ? null : <AppView className="my-1 w-0.5 flex-1 rounded-full bg-border" />}
            </AppView>
            <AppView className={cn('flex-1', isLast ? '' : 'pb-3')}>
              {stop.who ? (
                <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                  {stop.who}
                </AppText>
              ) : null}
              <AppText
                numberOfLines={compact ? 1 : undefined}
                className={cn(
                  'text-[13px] leading-[18px]',
                  stop.who ? 'mt-0.5 text-muted' : 'font-semibold text-foreground',
                )}
              >
                {stop.place || (stop.kind === 'pickup' ? 'Pickup' : 'Drop')}
              </AppText>
              {collapseStops && index === 0 && middleCount > 0 ? (
                <AppView className="mt-2 self-start rounded-full bg-brand-soft px-2 py-0.5">
                  <AppText className="text-[10.5px] font-bold uppercase tracking-wide text-brand-strong">
                    {middleCount} {middleCount === 1 ? 'stop' : 'stops'}
                  </AppText>
                </AppView>
              ) : null}
            </AppView>
          </AppView>
        );
      })}
    </AppView>
  );
}
