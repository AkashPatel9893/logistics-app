import { useState } from 'react';

import { ChatThread } from '@/components/chat-thread';
import { AppText, AppView, FocusAwareStatusBar, ScreenHeader } from '@/components/ui';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useReplyToTicket, useSupportTickets, useTicketMessages } from '@/queries';

import { ticketStatusLabel } from './ticket-status';

const AUTHORS: Record<string, string> = {
  AGENT: 'RYNO Support',
  BOT: 'RYNO Support',
  SYSTEM: 'Update',
};

/** One support request: the replies so far and a box to answer. */
export function SupportTicketScreen() {
  const router = useRouter();
  const { ticketId = '' } = useLocalSearchParams<{ ticketId?: string }>();
  const tickets = useSupportTickets();
  const ticket = tickets.data?.find((t) => t.id === ticketId);
  const messages = useTicketMessages(ticketId);
  const reply = useReplyToTicket(ticketId);
  const [error, setError] = useState<string>();

  const handleSend = async (body: string) => {
    setError(undefined);
    try {
      await reply.mutateAsync(body);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message not sent. Try again.');
      return false;
    }
  };

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScreenHeader
        title={ticket ? `Request ${ticket.number}` : 'Support request'}
        onBack={() => goBack(router)}
      />
      <ChatThread
        header={
          ticket ? (
            <AppView className="mb-2 rounded-2xl bg-surface-muted p-3.5">
              <AppText className="text-[15px] font-bold text-foreground">{ticket.subject}</AppText>
              <AppText className="mt-1 text-[13px] text-muted">
                {ticketStatusLabel(ticket.status)}
              </AppText>
              {ticket.resolutionNote ? (
                <AppText className="mt-2 text-[13px] text-foreground-secondary">
                  {ticket.resolutionNote}
                </AppText>
              ) : null}
            </AppView>
          ) : null
        }
        messages={(messages.data ?? []).map((m) => ({
          id: m.id,
          mine: m.sender === 'CUSTOMER',
          body: m.body,
          createdAt: m.createdAt,
          author: AUTHORS[m.sender],
        }))}
        loading={messages.isPending}
        loadFailed={messages.isError && !messages.data}
        onRetry={() => messages.refetch()}
        onRefresh={() => messages.refetch()}
        emptyText="No replies yet. Our team will answer here."
        closedText={
          ticket?.status === 'CLOSED'
            ? 'This request is closed. Report a new issue if you still need help.'
            : undefined
        }
        maxLength={5000}
        sending={reply.isPending}
        onSend={handleSend}
        error={error}
      />
    </AppView>
  );
}
