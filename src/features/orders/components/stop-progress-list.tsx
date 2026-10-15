import { AppText, AppView, Icon } from '@/components/ui';
import type { OrderStopProgress } from '@/lib/api/models';
import { cn } from '@/lib/cn';

const STATUS_TEXT: Record<OrderStopProgress['status'], string> = {
  pending: 'On the way',
  arrived: 'Driver at this stop',
  completed: 'Delivered',
};

/** Multi-stop orders: every delivery stop with its progress and, until delivered, its code. */
export function StopProgressList({ stops }: { stops: OrderStopProgress[] }) {
  return (
    <AppView className="mt-3 gap-2.5 rounded-2xl border border-divider bg-surface p-3">
      {stops.map((stop) => {
        const done = stop.status === 'completed';
        return (
          <AppView key={stop.number} className="flex-row items-center">
            <AppView
              center
              className={cn('mr-3 size-7 rounded-full', done ? 'bg-emerald-500' : 'bg-slate-600')}
            >
              {done ? (
                <Icon name="checkmark" size={13} color="#FFFFFF" />
              ) : (
                <AppText className="text-[12px] font-bold text-white">{stop.number}</AppText>
              )}
            </AppView>
            <AppView className="flex-1">
              <AppText numberOfLines={1} className="text-[13px] font-bold text-foreground">
                {stop.label || `Stop ${stop.number}`}
              </AppText>
              <AppText numberOfLines={1} className="text-[12px] text-muted">
                {[stop.contactName, STATUS_TEXT[stop.status]].filter(Boolean).join(' · ')}
              </AppText>
            </AppView>
            {!done && stop.code ? (
              <AppText
                accessibilityLabel={`Delivery code ${stop.code.split('').join(' ')}`}
                className="text-[15px] font-extrabold tracking-[3px] text-foreground"
              >
                {stop.code}
              </AppText>
            ) : null}
          </AppView>
        );
      })}
    </AppView>
  );
}
