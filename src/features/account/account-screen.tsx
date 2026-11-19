import type { ReactNode } from 'react';

import { useFloatingTabBarInset } from '@/components/floating-tab-bar';
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
import { useActiveRidesInset } from '@/features/orders/components/active-rides-dock';
import { cn } from '@/lib/cn';
import { formatFare } from '@/lib/format';
import { enterFromBelow } from '@/lib/motion';
import { useRouter } from '@/lib/navigation';

import { useAccountOverview } from './hooks/use-account-overview';

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

function Pill({ children }: { children: string }) {
  return (
    <AppView className="mr-2 rounded-full bg-brand-soft px-2.5 py-1">
      <AppText className="text-[11px] font-bold text-brand-strong">{children}</AppText>
    </AppView>
  );
}

export function AccountScreen() {
  const router = useRouter();
  const tabBarInset = useFloatingTabBarInset();
  const activeRidesInset = useActiveRidesInset();
  const {
    name,
    phone,
    identity,
    credits,
    savedCount,
    version,
    handleBusinessEnquiry,
    handleLogout,
  } = useAccountOverview();

  return (
    <AppView className="flex-1 bg-grouped pt-safe">
      <FocusAwareStatusBar />
      <AppScrollView
        contentContainerClassName="gap-4 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: tabBarInset + 24 + activeRidesInset }}
      >
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
                {identity ? (
                  <AppPressable
                    onPress={() => router.push('/edit-profile')}
                    accessibilityRole="button"
                    accessibilityLabel={
                      identity.email
                        ? `${identity.email}${identity.emailVerified ? ', verified' : ', verify email'}`
                        : 'Add your email'
                    }
                    className="mt-1 flex-row items-center gap-1.5 self-start"
                  >
                    {identity.email ? (
                      <>
                        <AppText numberOfLines={1} className="shrink text-[13px] text-muted">
                          {identity.email}
                        </AppText>
                        {identity.emailVerified ? (
                          <Icon name="checkmark.circle.fill" size={13} tone="success" />
                        ) : (
                          <AppText className="text-[13px] font-bold text-brand-strong">
                            Verify
                          </AppText>
                        )}
                      </>
                    ) : (
                      <AppText className="text-[13px] font-bold text-brand-strong">
                        Add email
                      </AppText>
                    )}
                  </AppPressable>
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
          </Card>
        </AnimatedView>

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
              icon="creditcard"
              label="Payments"
              subtitle="Your Ryno credits balance"
              trailing={credits > 0 ? <Pill>{formatFare(credits)}</Pill> : undefined}
              onPress={() => router.push('/wallet')}
              isLast
            />
          </MenuGroup>
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(2)}>
          <MenuGroup>
            <MenuItem
              icon="storefront.fill"
              label="Business enquiries"
              subtitle="Talk to our team about a business account"
              onPress={handleBusinessEnquiry}
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
    </AppView>
  );
}
