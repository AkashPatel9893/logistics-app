import { useEffect, useState } from 'react';

import { ChatThread } from '@/components/chat-thread';
import { AppView, FocusAwareStatusBar, ScreenHeader } from '@/components/ui';
import { ApiError } from '@/lib/api/api-error';
import { ordersApi } from '@/lib/api/orders';
import { goBack, useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useOrder, useOrderChat, useSendChat } from '@/queries';

/** Text chat with the driver while the order is live. */
export function OrderChatScreen() {
  const router = useRouter();
  const { orderId = '' } = useLocalSearchParams<{ orderId?: string }>();
  const order = useOrder(orderId);
  const chat = useOrderChat(orderId);
  const send = useSendChat(orderId);
  const [error, setError] = useState<string>();

  const messages = chat.data?.messages ?? [];
  const closed = chat.data?.open === false;
  const lastId = messages.at(-1)?.id;

  // Mark the driver's messages read whenever a new one shows up.
  useEffect(() => {
    if (lastId && !closed) ordersApi.markChatRead(orderId).catch(() => undefined);
  }, [lastId, closed, orderId]);

  const handleSend = async (body: string) => {
    setError(undefined);
    try {
      await send.mutateAsync(body);
      return true;
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === 'CHAT_CLOSED'
          ? 'Chat has ended for this order.'
          : e instanceof Error
            ? e.message
            : 'Message not sent. Try again.',
      );
      return false;
    }
  };

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScreenHeader
        title={`Chat with ${order.data?.driver?.name || 'driver'}`}
        onBack={() => goBack(router)}
      />
      <ChatThread
        messages={messages}
        loading={chat.isPending}
        loadFailed={chat.isError && !chat.data}
        onRetry={() => chat.refetch()}
        emptyText="No messages yet. Say hello to your driver."
        closedText={closed ? 'Chat has ended for this order.' : undefined}
        maxLength={1000}
        sending={send.isPending}
        onSend={handleSend}
        error={error}
      />
    </AppView>
  );
}
