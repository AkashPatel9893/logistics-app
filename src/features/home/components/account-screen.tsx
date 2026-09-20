import { SymbolView } from 'expo-symbols';
import { Alert, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppScrollView, AppText, AppView, Card } from '@/components/ui';
import { getDisplayName, signOut, useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/cn';
import { useOrdersStore } from '@/stores/orders-store';
import { useTripStore } from '@/stores/trip-store';

import { ACCOUNT_MOCK_DATA } from '@/features/home/mock-data';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconEmoji: string;
  iconBg: string;
  iconTint: string;
}

interface MenuLink {
  id: string;
  label: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RATING = ACCOUNT_MOCK_DATA.rating;

const PROMO_ITEMS: PromoItem[] = ACCOUNT_MOCK_DATA.promoItems;

const MENU_LINKS: MenuLink[] = ACCOUNT_MOCK_DATA.menuLinks;

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickActionCard({
  icon,
  emoji,
  label,
  onPress,
}: {
  icon: string;
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <AppPressable onPress={onPress} className="flex-1">
      <Card variant="default" className="items-start">
        <AppView className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 items-center justify-center mb-4">
          {Platform.OS === 'ios' ? (
            <SymbolView name={icon as any} size={16} tintColor="#171717" />
          ) : (
            <AppText style={{ fontSize: 14 }}>{emoji}</AppText>
          )}
        </AppView>
        <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          {label}
        </AppText>
      </Card>
    </AppPressable>
  );
}

function PromoCard({ item, onPress }: { item: PromoItem; onPress: () => void }) {
  return (
    <AppPressable onPress={onPress} className="mb-3">
      <Card variant="default" className="flex-row items-center">
        <AppView className="flex-1 pr-3">
          <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
            {item.title}
          </AppText>
          <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 leading-[18px]">
            {item.subtitle}
          </AppText>
        </AppView>
        <AppView className={cn('w-11 h-11 rounded-2xl items-center justify-center', item.iconBg)}>
          {Platform.OS === 'ios' ? (
            <SymbolView name={item.icon as any} size={18} tintColor={item.iconTint} />
          ) : (
            <AppText style={{ fontSize: 16 }}>{item.iconEmoji}</AppText>
          )}
        </AppView>
      </Card>
    </AppPressable>
  );
}

function MenuRow({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <AppPressable onPress={onPress} className="mb-3">
      <Card
        variant="default"
        className={cn(
          'flex-row items-center justify-between',
          destructive && 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40',
        )}
      >
        <AppText
          className={cn(
            'text-[15px] font-bold',
            destructive
              ? 'text-red-600 dark:text-red-400'
              : 'text-neutral-900 dark:text-neutral-100',
          )}
        >
          {label}
        </AppText>
        {Platform.OS === 'ios' ? (
          <SymbolView
            name="chevron.right"
            size={15}
            tintColor={destructive ? '#DC2626' : '#9CA3AF'}
          />
        ) : (
          <AppText className={destructive ? 'text-red-600' : 'text-neutral-400'}>›</AppText>
        )}
      </Card>
    </AppPressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AccountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore.use.user();
  const isGuest = user?.role === 'guest';
  const displayName = getDisplayName(user);

  const handleMenuPress = (link: MenuLink) => {
    Alert.alert(link.label, `${link.label} content goes here.`);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          useTripStore.getState().reset();
          useOrdersStore.getState().reset();
          signOut();
        },
      },
    ]);
  };

  return (
    <AppView className="flex-1 bg-[#F9F8F5] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-36"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Profile header */}
        <AppView className="flex-row items-start justify-between mb-5">
          <AppView className="flex-1 pr-3">
            <AppText className="text-[28px] font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {displayName}
            </AppText>
            <AppView className="flex-row items-center gap-1.5 mt-1.5">
              {isGuest ? (
                <AppText className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Guest account
                </AppText>
              ) : (
                <>
                  {Platform.OS === 'ios' ? (
                    <SymbolView name="star.fill" size={14} tintColor="#FF5A1F" />
                  ) : (
                    <AppText style={{ fontSize: 13 }}>⭐</AppText>
                  )}
                  <AppText className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-200">
                    {MOCK_RATING}
                  </AppText>
                </>
              )}
            </AppView>
          </AppView>
          <AppView className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center">
            {Platform.OS === 'ios' ? (
              <SymbolView name="person" size={24} tintColor="#6B7280" />
            ) : (
              <AppText style={{ fontSize: 20 }}>👤</AppText>
            )}
          </AppView>
        </AppView>

        {/* Quick actions */}
        <AppView className="flex-row gap-3 mb-6">
          <QuickActionCard
            icon="questionmark.circle"
            emoji="❓"
            label="Help"
            onPress={() => Alert.alert('Help', 'Help & support content goes here.')}
          />
          <QuickActionCard
            icon="creditcard"
            emoji="💳"
            label="Wallet"
            onPress={() => Alert.alert('Wallet', 'Wallet content goes here.')}
          />
        </AppView>

        {/* Promo cards */}
        {PROMO_ITEMS.map((item) => (
          <PromoCard
            key={item.id}
            item={item}
            onPress={() => Alert.alert(item.title, item.subtitle)}
          />
        ))}

        {/* Menu */}
        <AppText className="text-[13px] font-semibold text-neutral-400 dark:text-neutral-500 mt-3 mb-3">
          Menu
        </AppText>
        {MENU_LINKS.map((link) => (
          <MenuRow key={link.id} label={link.label} onPress={() => handleMenuPress(link)} />
        ))}

        <MenuRow label="Logout" onPress={handleLogout} destructive />
      </AppScrollView>
    </AppView>
  );
}
