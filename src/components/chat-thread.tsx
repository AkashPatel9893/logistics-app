import { useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance } from 'react-native';

import {
  AppKeyboardAvoidingView,
  AppPressable,
  AppRefreshControl,
  AppSpinner,
  AppText,
  AppTextInput,
  AppView,
  Button,
  Icon,
} from '@/components/ui';

export interface ChatThreadMessage {
  id: string;
  mine: boolean;
  body: string;
  createdAt: string;
  /** Small line above the bubble, e.g. "RYNO Support". */
  author?: string;
}

export interface ChatThreadProps {
  messages: ChatThreadMessage[];
  loading: boolean;
  loadFailed: boolean;
  onRetry: () => void;
  /** Pull to refresh: fetches new messages now instead of waiting for the next check. */
  onRefresh?: () => Promise<unknown>;
  emptyText: string;
  /** Shown above the list, e.g. the ticket subject. */
  header?: React.ReactNode;
  /** When set, the reply box is replaced by this line. */
  closedText?: string;
  maxLength: number;
  sending: boolean;
  /** Resolves true when the message was sent, so the box can clear. */
  onSend: (body: string) => Promise<boolean>;
  error?: string;
}

function timeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return date.toLocaleString('en-IN', {
    ...(sameDay ? {} : { day: 'numeric', month: 'short' }),
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** A message list with a reply box under it. */
export function ChatThread({
  messages,
  loading,
  loadFailed,
  onRetry,
  onRefresh,
  emptyText,
  header,
  closedText,
  maxLength,
  sending,
  onSend,
  error,
}: ChatThreadProps) {
  const [text, setText] = useState('');
  // Only a pull shows the spinner; the background checks stay invisible.
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = onRefresh
    ? () => {
        setRefreshing(true);
        void onRefresh().finally(() => setRefreshing(false));
      }
    : undefined;
  const scroll = useRef<ScrollViewInstance>(null);
  const canSend = text.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    if (await onSend(text.trim())) setText('');
  };

  return (
    <AppKeyboardAvoidingView className="flex-1">
      {loading ? (
        <AppView className="flex-1 items-center justify-center">
          <AppSpinner />
        </AppView>
      ) : loadFailed ? (
        <AppView className="flex-1 items-center justify-center gap-3 px-8">
          <AppText className="text-center text-[15px] text-muted">Could not load messages.</AppText>
          <Button label="Try again" variant="outline" onPress={onRetry} />
        </AppView>
      ) : (
        <ScrollView
          ref={scroll}
          className="flex-1"
          contentContainerClassName="gap-2 px-4 py-3"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            handleRefresh ? (
              <AppRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            ) : undefined
          }
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        >
          {header}
          {messages.length === 0 ? (
            <AppText className="mt-10 text-center text-[14px] text-muted">{emptyText}</AppText>
          ) : (
            messages.map((m) => (
              <AppView key={m.id} className={`max-w-[80%] ${m.mine ? 'self-end' : 'self-start'}`}>
                {m.author ? (
                  <AppText className="mb-0.5 ml-1 text-[11px] font-semibold text-muted">
                    {m.author}
                  </AppText>
                ) : null}
                <AppView
                  className={`rounded-2xl px-3.5 py-2 ${m.mine ? 'bg-brand' : 'bg-surface-muted'}`}
                >
                  <AppText
                    className={`text-[15px] ${m.mine ? 'text-brand-foreground' : 'text-foreground'}`}
                  >
                    {m.body}
                  </AppText>
                  <AppText
                    className={`mt-0.5 text-right text-[11px] ${
                      m.mine ? 'text-brand-foreground/80' : 'text-muted'
                    }`}
                  >
                    {timeOf(m.createdAt)}
                  </AppText>
                </AppView>
              </AppView>
            ))
          )}
        </ScrollView>
      )}

      <AppView className="border-t border-divider px-4 pb-safe-offset-2 pt-2">
        {error ? <AppText className="mb-1.5 text-[13px] text-error">{error}</AppText> : null}
        {closedText ? (
          <AppText className="py-3 text-center text-[14px] text-muted">{closedText}</AppText>
        ) : (
          <AppView row className="items-end gap-2">
            <AppTextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              multiline
              maxLength={maxLength}
              accessibilityLabel="Message"
              className="max-h-28 min-h-[44px] flex-1 rounded-2xl bg-surface-muted px-4 py-2.5 text-[15px]"
            />
            <AppPressable
              onPress={handleSend}
              disabled={!canSend}
              accessibilityLabel="Send message"
              className={`size-11 items-center justify-center rounded-full bg-brand ${
                canSend ? '' : 'opacity-50'
              }`}
            >
              {sending ? (
                <AppSpinner tone="brand-foreground" />
              ) : (
                <Icon name="arrow.up" size={18} tone="brand-foreground" />
              )}
            </AppPressable>
          </AppView>
        )}
      </AppView>
    </AppKeyboardAvoidingView>
  );
}
