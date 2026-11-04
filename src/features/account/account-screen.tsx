import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  SectionLabel,
  type IconName,
} from '@/components/ui';
import { getDisplayName, signOut, useAuthStore } from '@/features/auth/use-auth-store';
import { shareReferral } from '@/features/offers/referral';
import { useAccountSummary } from '@/hooks/use-content';
import { useTripStore } from '@/stores/trip-store';
import { authApi } from '@/lib/api/auth';

import { MenuRow } from './components/menu-row';
import { PromoCard } from './components/promo-card';
import { QuickActionCard } from './components/quick-action-card';

interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

// Per-promo icon tile tint (presentation, so it lives here rather than in API data).
const PROMO_ICON_BACKGROUND: Record<string, string> = {
  promos: 'bg-promo-red-soft',
  ryno: 'bg-brand-soft',
  safety: 'bg-promo-violet-soft',
};

export function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore.use.user();
  const { data: currentUser } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: !!user?.isOnboarded,
  });
  const summaryQuery = useAccountSummary();
  const { data: summary } = summaryQuery;

  const handleMenuPress = (id: string, label: string) => {
    if (id === 'refer') {
      shareReferral(user);
      return;
    }
    Alert.alert(label, `${label} content goes here.`);
  };

  const handlePromoPress = (item: PromoItem) => {
    Alert.alert(item.title, item.subtitle);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          useTripStore.getState().reset();
          signOut();
        },
      },
    ]);
  };

  return (
    // Inset on the container (not the scroll view) so content clips below the
    // status bar instead of scrolling up under the clock.
    <AppView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <FocusAwareStatusBar />
      <AppScrollView contentContainerClassName="px-5 pb-6 pt-4">
        <AppView className="mb-5 flex-row items-start justify-between">
          <AppView className="flex-1 pr-3">
            <AppText className="text-[28px] font-extrabold tracking-tight text-foreground">
              {getDisplayName(user)}
            </AppText>
            {currentUser?.phone || user?.phone ? (
              <AppText className="mt-1 text-[13px] text-muted">
                Phone: {currentUser?.phone || user?.phone}
              </AppText>
            ) : null}
            {/* Customers are not rated yet; the star shows only once the backend sends a rating. */}
            {summary?.rating != null ? (
              <AppView row className="mt-1.5 gap-1.5">
                <Icon name="star.fill" size={14} tone="brand" />
                <AppText className="text-[15px] font-semibold text-foreground-emphasis">
                  {summary.rating}
                </AppText>
              </AppView>
            ) : null}
          </AppView>
          <IconBadge name="person" iconSize={24} className="size-14 bg-border" />
        </AppView>

        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          className="mb-5 self-start"
          onPress={() => router.push('/edit-profile')}
        >
          <AppText className="font-bold text-brand">Edit profile</AppText>
        </AppPressable>

        <AppView className="mb-6 flex-row gap-3">
          <QuickActionCard
            icon="questionmark.circle"
            label="Help"
            onPress={() => router.push('/support')}
          />
          <QuickActionCard
            icon="creditcard"
            label="Payment"
            onPress={() => router.push('/wallet')}
          />
        </AppView>

        {summary?.promoItems.map((item) => (
          <PromoCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon as IconName}
            iconBackgroundClassName={PROMO_ICON_BACKGROUND[item.id] ?? 'bg-brand-soft'}
            onPress={() => handlePromoPress(item)}
          />
        ))}

        {summaryQuery.isError ? (
          <AppPressable onPress={() => summaryQuery.refetch()} className="mb-4">
            <AppText className="text-muted">
              Account details could not be loaded. Tap to retry.
            </AppText>
          </AppPressable>
        ) : null}
        <SectionLabel className="mb-3 mt-3 text-subtle">Menu</SectionLabel>
        {summary?.menuLinks.map((link) => (
          <MenuRow
            key={link.id}
            label={link.label}
            onPress={() => handleMenuPress(link.id, link.label)}
          />
        ))}
        <MenuRow label="Logout" onPress={handleLogout} destructive />
      </AppScrollView>
    </AppView>
  );
}
