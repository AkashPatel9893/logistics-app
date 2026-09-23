import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedView,
  AppScrollView,
  AppText,
  AppView,
  FocusAwareStatusBar,
  ScreenHeader,
  SectionLabel,
} from '@/components/ui';
import { useSupportInfo } from '@/hooks/use-content';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { useOrder } from '@/hooks/use-orders';

import { ContactButton } from './components/contact-button';
import { FaqRow } from './components/faq-row';

function openOrAlert(url: string, fallbackMessage: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unable to open', fallbackMessage));
}

export function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { data: support } = useSupportInfo();
  const { data: order } = useOrder(orderId);
  const faqLayout = useLayoutTransition();
  const orderRef = order ? `#${order.number}` : null;
  const emailSubject = encodeURIComponent(
    orderRef ? `Help with order ${orderRef}` : 'Help with RYNO',
  );

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Help & support" onBack={() => router.back()} />

      <AppScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {orderRef ? (
          <AppText className="mb-3 text-[13px] text-muted">
            Getting help with order {orderRef}
          </AppText>
        ) : null}

        <AppView className="mb-6 flex-row gap-3">
          <ContactButton
            icon="phone.fill"
            label="Call us"
            onPress={() =>
              support &&
              openOrAlert(`tel:${support.phone}`, `Please dial ${support.phone} manually.`)
            }
          />
          <ContactButton
            icon="envelope.fill"
            label="Email us"
            onPress={() =>
              support &&
              openOrAlert(
                `mailto:${support.email}?subject=${emailSubject}`,
                `Please write to ${support.email}.`,
              )
            }
          />
        </AppView>

        <SectionLabel className="mb-1 text-subtle">Frequently asked questions</SectionLabel>
        {/*
          Mounted once the FAQs exist: on Android a layout-animated container
          that mounts empty stays at zero height when its rows arrive.
        */}
        {support ? (
          <AnimatedView layout={faqLayout} className="rounded-2xl bg-surface px-4">
            {support.faqs.map((faq) => (
              <FaqRow key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </AnimatedView>
        ) : null}
      </AppScrollView>
    </AppView>
  );
}
