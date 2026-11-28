import { AppPressable, AppText, AppView, Icon, Skeleton } from '@/components/ui';
import { formatShortDate } from '@/lib/format';
import { useRouter } from '@/lib/navigation';
import { useSupportTickets } from '@/queries';

import { isTicketDone, ticketStatusLabel } from '../ticket-status';

const SHOWN = 5;

/** The customer's support requests, newest first; each opens its replies. */
export function MyTickets() {
  const router = useRouter();
  const tickets = useSupportTickets();

  if (tickets.isPending) return <Skeleton className="h-[68px] rounded-2xl" />;
  if (tickets.isError) {
    return (
      <AppPressable onPress={() => tickets.refetch()} className="rounded-2xl bg-surface p-4">
        <AppText className="text-[13px] text-muted">
          Your requests could not be loaded. Tap to retry.
        </AppText>
      </AppPressable>
    );
  }
  if (!tickets.data.length) {
    return (
      <AppView className="rounded-2xl bg-surface p-4">
        <AppText className="text-[13px] text-muted">
          No requests yet. Issues you report show here with our replies.
        </AppText>
      </AppView>
    );
  }

  return (
    <AppView className="overflow-hidden rounded-2xl bg-surface">
      {tickets.data.slice(0, SHOWN).map((t, i) => (
        <AppPressable
          key={t.id}
          onPress={() => router.push({ pathname: '/support-ticket', params: { ticketId: t.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Request ${t.number}, ${t.subject}, ${ticketStatusLabel(t.status)}`}
          className={`flex-row items-center px-4 py-3.5 ${i > 0 ? 'border-t border-divider' : ''}`}
        >
          <AppView className="flex-1 pr-2">
            <AppText numberOfLines={1} className="text-[15px] font-semibold text-foreground">
              {t.subject}
            </AppText>
            <AppText className="mt-0.5 text-[12px] text-muted">
              {t.number}
              {t.createdAt ? ` · ${formatShortDate(t.createdAt)}` : ''}
            </AppText>
          </AppView>
          <AppText
            className={`mr-2 text-[12px] font-bold ${
              t.status === 'WAITING_CUSTOMER'
                ? 'text-brand-strong'
                : isTicketDone(t.status)
                  ? 'text-muted'
                  : 'text-foreground-secondary'
            }`}
          >
            {ticketStatusLabel(t.status)}
          </AppText>
          <Icon name="chevron.right" size={13} tone="icon-subtle" />
        </AppPressable>
      ))}
    </AppView>
  );
}
