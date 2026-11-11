import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Card,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  Skeleton,
} from '@/components/ui';
import { OrderCard, OrderCardSkeleton } from '@/features/orders/components/order-card';
import { useSupportInfo } from '@/hooks/use-content';
import { useOrder, useOrderHistory } from '@/hooks/use-orders';
import type { Order } from '@/lib/api/models';
import { goBack } from '@/lib/go-back';
import { enterFromBelow } from '@/lib/motion';

import { ContactButton } from './components/contact-button';
import { ReportIssueSheet } from './components/report-issue-sheet';

function openOrAlert(url: string, fallbackMessage: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unable to open', fallbackMessage));
}

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText accessibilityRole="header" className="mb-3 text-[17px] font-bold text-foreground">
      {children}
    </AppText>
  );
}

/**
 * Help, like Porter's: the order you most likely need help with (and Report issue), ways to reach
 * us, then the help centre. Everything here comes from the API: no answers are written in the app.
 */
export function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const supportQuery = useSupportInfo();
  const support = supportQuery.data;
  // Opened from a trip: help with that trip. Otherwise the latest one.
  const linkedOrder = useOrder(orderId);
  const history = useOrderHistory();
  const latest = history.data?.pages[0]?.items[0];
  const order = orderId ? linkedOrder.data : latest;
  const orderPending = orderId ? linkedOrder.isPending : history.isPending;
  const [reportFor, setReportFor] = useState<Order | null>(null);

  const orderRef = order ? `#${order.number}` : null;
  const emailSubject = encodeURIComponent(
    orderRef ? `Help with order ${orderRef}` : 'Help with RYNO',
  );

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Help & support" onBack={() => goBack(router)} className="pb-3" />

      <AppScrollView
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <AppView className="mb-6 px-1">
          <AppText className="text-[24px] font-extrabold tracking-tight text-foreground">
            How can we help?
          </AppText>
          <AppText className="mt-1 text-[14px] leading-[20px] text-muted">
            Report a problem with a trip, reach our team, or find a quick answer.
          </AppText>
        </AppView>

        {/* The order to get help with. */}
        {orderPending ? (
          <AppView className="mb-6">
            <Skeleton className="mb-3 h-5 w-52 rounded-md" />
            <OrderCardSkeleton />
          </AppView>
        ) : order ? (
          <AnimatedView entering={enterFromBelow(0)} className="mb-6">
            <SectionTitle>
              {orderId ? 'Help with this trip' : 'Need help with a recent trip?'}
            </SectionTitle>
            <OrderCard
              order={order}
              onPress={(selected) =>
                router.push({ pathname: '/order-tracking', params: { orderId: selected.id } })
              }
              action={
                <AppPressable
                  onPress={() => setReportFor(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Report an issue with trip ${order.number}`}
                  className="flex-row items-center gap-1.5 rounded-xl border border-brand px-3.5 py-2"
                >
                  <Icon name="exclamationmark.bubble.fill" size={14} tone="brand" />
                  <AppText className="text-[13px] font-bold text-brand-strong">
                    Report issue
                  </AppText>
                </AppPressable>
              }
            />
            {orderId ? null : (
              <AppPressable
                onPress={() => router.push('/orders')}
                accessibilityRole="button"
                className="flex-row items-center justify-center gap-1 py-1"
              >
                <AppText className="text-[13px] font-bold text-brand-strong">
                  See all orders
                </AppText>
                <Icon name="chevron.right" size={13} tone="brand" />
              </AppPressable>
            )}
          </AnimatedView>
        ) : null}

        {/* Reach the team. */}
        <AnimatedView entering={enterFromBelow(1)} className="mb-6">
          <SectionTitle>Contact us</SectionTitle>
          {supportQuery.isPending ? (
            <AppView row className="gap-3">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-[76px] flex-1 rounded-2xl" />
              ))}
            </AppView>
          ) : support ? (
            <AppView row className="gap-3">
              <ContactButton
                icon="phone.fill"
                label="Call us"
                onPress={() =>
                  openOrAlert(`tel:${support.phone}`, `Please dial ${support.phone} manually.`)
                }
              />
              <ContactButton
                icon="envelope.fill"
                label="Email us"
                onPress={() =>
                  openOrAlert(
                    `mailto:${support.email}?subject=${emailSubject}`,
                    `Please write to ${support.email}.`,
                  )
                }
              />
              {support.whatsapp ? (
                <ContactButton
                  icon="message.fill"
                  label="WhatsApp"
                  onPress={() => {
                    const cleanPhone = support.whatsapp?.replace(/[^0-9]/g, '') ?? '';
                    const text = encodeURIComponent(
                      orderRef
                        ? `Hi RYNO Support, I need help with order ${orderRef}`
                        : 'Hi RYNO Support',
                    );
                    openOrAlert(
                      `https://wa.me/${cleanPhone}?text=${text}`,
                      `Please message ${support.whatsapp} on WhatsApp.`,
                    );
                  }}
                />
              ) : null}
            </AppView>
          ) : (
            <AppPressable
              onPress={() => supportQuery.refetch()}
              className="rounded-2xl bg-surface p-4"
            >
              <AppText className="text-[13px] text-muted">
                Contact details could not be loaded. Tap to retry.
              </AppText>
            </AppPressable>
          )}
        </AnimatedView>

        {/* Answers live in the help centre the backend points to. */}
        {support?.faqUrl ? (
          <AnimatedView entering={enterFromBelow(2)}>
            <SectionTitle>Quick answers</SectionTitle>
            <AppPressable
              onPress={() =>
                void WebBrowser.openBrowserAsync(support.faqUrl).catch(() => undefined)
              }
              accessibilityRole="link"
              accessibilityLabel="Open the help centre"
            >
              <Card variant="elevated" className="flex-row items-center rounded-3xl p-4">
                <IconBadge
                  name="questionmark.circle"
                  tone="brand"
                  iconSize={18}
                  className="mr-3.5 size-10 rounded-xl bg-brand-soft"
                />
                <AppView className="flex-1 pr-2">
                  <AppText className="text-[15px] font-semibold text-foreground">
                    Help centre
                  </AppText>
                  <AppText className="mt-0.5 text-[12px] text-muted">
                    Answers to common questions
                  </AppText>
                </AppView>
                <Icon name="chevron.right" size={15} tone="icon-subtle" />
              </Card>
            </AppPressable>
          </AnimatedView>
        ) : null}
      </AppScrollView>

      <ReportIssueSheet order={reportFor} onClose={() => setReportFor(null)} />
    </AppView>
  );
}
