import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Card,
  Icon,
  type IconName,
} from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { supportEndpoints } from '@/data/mock';

const SUPPORT = supportEndpoints.supportEndpoint.data;

type FaqItem = (typeof SUPPORT.faqs)[number];

function openOrAlert(url: string, fallback: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unable to open', fallback));
}

interface ContactButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function ContactButton({ icon, label, onPress }: ContactButtonProps) {
  return (
    <AppPressable onPress={onPress} className="flex-1" accessibilityRole="button">
      <Card
        variant="outline"
        className="items-center py-4 border-neutral-100 dark:border-neutral-800"
      >
        <Icon name={icon} size={20} color="#FF5A1F" />
        <AppText className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 mt-2">
          {label}
        </AppText>
      </Card>
    </AppPressable>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AppPressable
      onPress={() => setIsOpen((open) => !open)}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      className="py-3.5 border-b border-neutral-100 dark:border-neutral-800"
    >
      <AppView className="flex-row items-center justify-between">
        <AppText className="flex-1 pr-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {item.question}
        </AppText>
        <Icon name={isOpen ? 'chevron.up' : 'chevron.down'} size={13} color="#9CA3AF" />
      </AppView>
      {isOpen && (
        <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 leading-[19px]">
          {item.answer}
        </AppText>
      )}
    </AppPressable>
  );
}

export function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const orderRef = orderId ? `#${orderId.slice(-6).toUpperCase()}` : null;

  const emailSubject = encodeURIComponent(
    orderRef ? `Help with order ${orderRef}` : 'Help with RYNO',
  );

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppView style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-4">
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppText className="ml-3 text-[19px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Help & support
        </AppText>
      </AppView>

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      >
        {orderRef && (
          <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-3">
            Getting help with order {orderRef}
          </AppText>
        )}

        <AppView className="flex-row gap-3 mb-6">
          <ContactButton
            icon="phone.fill"
            label="Call us"
            onPress={() =>
              openOrAlert(`tel:${SUPPORT.phone}`, `Please dial ${SUPPORT.phone} manually.`)
            }
          />
          <ContactButton
            icon="envelope.fill"
            label="Email us"
            onPress={() =>
              openOrAlert(
                `mailto:${SUPPORT.email}?subject=${emailSubject}`,
                `Please write to ${SUPPORT.email}.`,
              )
            }
          />
        </AppView>

        <AppText className="text-[13px] font-semibold text-neutral-400 dark:text-neutral-500 mb-1">
          Frequently asked questions
        </AppText>
        <AppView className="bg-white dark:bg-neutral-900 rounded-2xl px-4">
          {SUPPORT.faqs.map((item) => (
            <FaqRow key={item.id} item={item} />
          ))}
        </AppView>
      </AppScrollView>
    </AppView>
  );
}
