import { AppView } from '@/components/ui';
import { cn } from '@/lib/cn';

export function StopConnector({ className }: { className?: string }) {
  return (
    <AppView accessible={false} className={cn('my-1 w-[2px] items-center gap-[3px]', className)}>
      <AppView className="size-[3px] rounded-full bg-border-strong" />
      <AppView className="size-[3px] rounded-full bg-border-strong" />
      <AppView className="size-[3px] rounded-full bg-border-strong" />
    </AppView>
  );
}
