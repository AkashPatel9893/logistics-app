import { BottomSheet, Host, RNHostView } from '@expo/ui';
import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppText, AppView, Icon, IconBadge, type IconName } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

/** Content taller than this scrolls inside the sheet; the footer stays in view under it. */
const MAX_CONTENT_SHARE = 0.68;

export interface BookingSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Pinned under the scrolling content (a confirm button). */
  footer?: ReactNode;
  /**
   * `auto` (default) sizes the sheet to its content. `full` opens it at full height, for long
   * lists: an auto sheet taller than half the screen opens half-way, hiding its footer.
   */
  size?: 'auto' | 'full';
}

/**
 * The bottom sheet every Review Booking action opens (addresses, goods, payment…). It is the app's
 * native sheet from `@expo/ui`, the same one the language picker uses: the system draws and
 * animates it, sized to its content, so it opens flush with the bottom of the screen.
 */
export function BookingSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'auto',
}: BookingSheetProps) {
  const surface = useThemeColor('surface');
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Host style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BottomSheet
        isPresented={visible}
        onDismiss={onClose}
        showDragIndicator
        snapPoints={size === 'full' ? ['full'] : undefined}
        contentPadding={0}
        containerColor={surface}
      >
        {/* RN content in the native sheet must sit in an RNHostView, or Android drops the taps. */}
        <RNHostView matchContents>
          <AppView
            className="bg-surface"
            style={{
              width,
              paddingBottom: insets.bottom + 12,
              // Full sheets fill the screen under the status bar and drag handle, footer at the bottom.
              height: size === 'full' ? height - insets.top - 48 : undefined,
            }}
          >
            <AppView row className="items-start px-5 pb-3 pt-1">
              <AppView className="flex-1 pr-3">
                <AppText
                  accessibilityRole="header"
                  className="text-[20px] font-bold text-foreground"
                >
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText className="mt-0.5 text-[13px] text-muted">{subtitle}</AppText>
                ) : null}
              </AppView>
              <AppPressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                className="size-9 items-center justify-center rounded-full bg-surface-muted"
              >
                <Icon name="xmark.circle.fill" size={18} tone="icon" />
              </AppPressable>
            </AppView>
            {/* Plain ScrollView sized to its content (the app's scroll view is flex-1). */}
            <ScrollView
              style={size === 'full' ? { flex: 1 } : { maxHeight: height * MAX_CONTENT_SHARE }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
            >
              {children}
            </ScrollView>
            {footer ? <AppView className="px-5 pt-2">{footer}</AppView> : null}
          </AppView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}

export interface SheetOptionProps {
  label: string;
  subtitle?: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}

/** One choice in a booking sheet (goods type, payment method): icon, label and a radio dot. */
export function SheetOption({ label, subtitle, icon, selected, onPress }: SheetOptionProps) {
  return (
    <AppPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[label, subtitle].filter(Boolean).join(', ')}
      pressScale={0.98}
      className={cn(
        'flex-row items-center rounded-2xl border px-3 py-3',
        selected ? 'border-brand bg-brand-soft' : 'border-border bg-surface',
      )}
    >
      <IconBadge
        name={icon}
        tone={selected ? 'brand-foreground' : 'foreground'}
        className={cn('mr-3 rounded-xl', selected ? 'bg-brand' : 'bg-surface-muted')}
      />
      <AppView className="flex-1">
        <AppText className="text-[15px] font-semibold text-foreground">{label}</AppText>
        {subtitle ? <AppText className="mt-0.5 text-[12px] text-muted">{subtitle}</AppText> : null}
      </AppView>
      <AppView
        center
        className={cn(
          'size-5 rounded-full border-2',
          selected ? 'border-brand bg-brand' : 'border-border-strong',
        )}
      >
        {selected ? <AppView className="size-2 rounded-full bg-surface" /> : null}
      </AppView>
    </AppPressable>
  );
}
