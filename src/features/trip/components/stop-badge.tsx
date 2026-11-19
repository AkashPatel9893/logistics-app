import { AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

export type StopBadgeKind = 'pickup' | 'stop' | 'drop' | 'final';

export interface StopBadgeProps {
  kind: StopBadgeKind;
  number?: number;
  className?: string;
}

export function StopBadge({ kind, number, className }: StopBadgeProps) {
  if (kind === 'stop') {
    return (
      <AppView center className={cn('size-7 rounded-full bg-slate-600', className)}>
        <AppText className="text-[12px] font-bold text-white">{number}</AppText>
      </AppView>
    );
  }

  const isPickup = kind === 'pickup';
  return (
    <AppView
      center
      className={cn('size-7 rounded-full', isPickup ? 'bg-emerald-500' : 'bg-rose-500', className)}
    >
      <Icon name={isPickup ? 'arrow.up' : 'arrow.down'} size={14} color="#FFFFFF" />
    </AppView>
  );
}
