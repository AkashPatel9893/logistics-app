import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
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
  type IconName,
} from '@/components/ui';
import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
import { getDisplayName, signOut, useAuthStore } from '@/features/auth/use-auth-store';
import { GstinSheet } from '@/components/gstin-sheet';
import { useGstinStore } from '@/stores/gstin-store';
import { useSavedAddresses } from '@/hooks/use-addresses';
import { useAccountSummary } from '@/hooks/use-content';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/cn';
import { enterFromBelow } from '@/lib/motion';
import { useTripStore } from '@/stores/trip-store';

/** "Akash Patel" → "AP"; one letter for a single name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '');
}

function MenuGroup({ children }: { children: ReactNode }) {
  return (
    <Card variant="elevated" className="overflow-hidden rounded-3xl p-0">
      {children}
    </Card>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  trailing,
  tone = 'default',
  isLast = false,
}: {
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  /** Shown before the chevron (a badge, a count, an action pill). */
  trailing?: ReactNode;
  tone?: 'default' | 'danger';
  isLast?: boolean;
}) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, subtitle].filter(Boolean).join(', ')}
      className={cn('flex-row items-center px-4 py-3.5', !isLast && 'border-b border-divider')}
    >
      <IconBadge
        name={icon}
        tone={tone === 'danger' ? 'danger' : 'foreground'}
        iconSize={18}
        className={cn(
          'mr-3.5 size-10 rounded-xl',
          tone === 'danger' ? 'bg-danger/10' : 'bg-surface-muted',
        )}
      />
      <AppView className="flex-1 pr-2">
        <AppText
          className={cn(
            'text-[15px] font-semibold',
            tone === 'danger' ? 'text-danger' : 'text-foreground',
          )}
        >
          {label}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
            {subtitle}
          </AppText>
        ) : null}
      </AppView>
      {trailing}
      {tone === 'danger' ? null : <Icon name="chevron.right" size={15} tone="icon-subtle" />}
    </AppPressable>
  );
}

function Pill({ children, tone = 'brand' }: { children: string; tone?: 'brand' | 'new' }) {
  return (
    <AppView
      className={cn(
        'mr-2 rounded-full px-2.5 py-1',
        tone === 'new' ? 'bg-amber-500/15' : 'bg-brand-soft',
      )}
    >
      <AppText
        className={cn(
          'text-[11px] font-bold',
          tone === 'new' ? 'text-amber-700' : 'text-brand-strong',
        )}
      >
        {children}
      </AppText>
    </AppView>
  );
}

/** Account, like Porter's: who you are, your places and business details, help, logout. */
export function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useFloatingTabBarInset();
  const user = useAuthStore.use.user();
  const { data: currentUser } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: !!user?.isOnboarded,
  });
  const { data: summary } = useAccountSummary();
  const savedCount = (useSavedAddresses().data ?? []).filter((a) => a.label !== 'recent').length;
  const gstin = useGstinStore((state) => state.gstin);
  const [showGstin, setShowGstin] = useState(false);
  const name = getDisplayName(user);
  const phone = currentUser?.phone || user?.phone;
  const version = Constants.expoConfig?.version;

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
    <AppView className="flex-1 bg-grouped" style={{ paddingTop: insets.top }}>
      <FocusAwareStatusBar />
      <AppScrollView
        contentContainerClassName="gap-4 px-4 pt-4"
        // Scrolls behind the floating tab bar; the end stays clear of it.
        contentContainerStyle={{ paddingBottom: tabBarInset + 24 }}
      >
        {/* Profile */}
        <AnimatedView entering={enterFromBelow(0)}>
          <Card variant="elevated" className="overflow-hidden rounded-3xl p-0">
            <AppView row className="items-center p-4">
              <AppView center className="mr-3.5 size-16 rounded-full bg-brand">
                <AppText className="text-[22px] font-black text-brand-foreground">
                  {initials(name).toUpperCase() || '?'}
                </AppText>
              </AppView>
              <AppView className="flex-1 pr-2">
                <AppText numberOfLines={1} className="text-[20px] font-extrabold text-foreground">
                  {name}
                </AppText>
                {phone ? (
                  <AppText className="mt-0.5 text-[13px] text-muted">{phone}</AppText>
                ) : null}
                {/* Customers are not rated yet; the star shows only once the backend sends a rating. */}
                {summary?.rating != null ? (
                  <AppView row className="mt-1 items-center gap-1">
                    <Icon name="star.fill" size={13} tone="brand" />
                    <AppText className="text-[13px] font-semibold text-foreground">
                      {summary.rating}
                    </AppText>
                  </AppView>
                ) : null}
              </AppView>
              <AppPressable
                onPress={() => router.push('/edit-profile')}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                className="flex-row items-center gap-1 rounded-full bg-surface-muted px-3 py-2"
              >
                <Icon name="pencil" size={12} tone="foreground" />
                <AppText className="text-[13px] font-bold text-foreground">Edit</AppText>
              </AppPressable>
            </AppView>
            <AppPressable
              onPress={() => setShowGstin(true)}
              accessibilityRole="button"
              className="flex-row items-center border-t border-divider px-4 py-3"
            >
              <Icon
                name={gstin ? 'checkmark.circle.fill' : 'plus.circle.fill'}
                size={16}
                tone="brand"
              />
              <AppText className="ml-2 flex-1 text-[13px] font-bold text-brand-strong">
                {gstin ? `GSTIN ${gstin}` : 'Add GST details'}
              </AppText>
              <Icon name="chevron.right" size={14} tone="icon-subtle" />
            </AppPressable>
          </Card>
        </AnimatedView>

        {/* Places, business and payments */}
        <AnimatedView entering={enterFromBelow(1)}>
          <MenuGroup>
            <MenuItem
              icon="heart.fill"
              label="Saved addresses"
              subtitle="Home, shop and other places"
              trailing={savedCount > 0 ? <Pill>{String(savedCount)}</Pill> : undefined}
              onPress={() => router.push('/saved-addresses')}
            />
            <MenuItem
              icon="briefcase"
              label="Business details"
              subtitle={gstin ? `GSTIN ${gstin}` : 'Add your GSTIN for tax invoices'}
              trailing={gstin ? undefined : <Pill>Add GSTIN</Pill>}
              onPress={() => setShowGstin(true)}
            />
            <MenuItem
              icon="creditcard"
              label="Payments"
              subtitle="Payment methods and wallet"
              onPress={() => router.push('/wallet')}
              isLast
            />
          </MenuGroup>
        </AnimatedView>

        {/* Business solution: the MOM asks for a way to enquire about a business account. */}
        <AnimatedView entering={enterFromBelow(2)}>
          <MenuGroup>
            <MenuItem
              icon="storefront.fill"
              label="Ryno for Business"
              subtitle="Regular deliveries for your business"
              trailing={<Pill tone="new">NEW</Pill>}
              onPress={() => router.push('/support')}
              isLast
            />
          </MenuGroup>
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(3)}>
          <MenuGroup>
            <MenuItem
              icon="questionmark.circle"
              label="Help & support"
              onPress={() => router.push('/support')}
            />
            <MenuItem
              icon="lock.fill"
              label="Log out"
              tone="danger"
              onPress={handleLogout}
              isLast
            />
          </MenuGroup>
        </AnimatedView>

        {version ? (
          <AppText className="mt-1 text-center text-[12px] text-subtle">
            App version {version}
          </AppText>
        ) : null}
      </AppScrollView>

      <GstinSheet visible={showGstin} onClose={() => setShowGstin(false)} />
    </AppView>
  );
}
