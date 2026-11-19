import type { ReactNode } from 'react';

import {
  AppKeyboardAvoidingView,
  AppModalBottomSheet,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Icon,
  IconBadge,
  type IconName,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { useWindowDimensions } from '@/lib/native';

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
 * The modal bottom sheet every action opens (addresses, goods, payment, support…). Backed by
 * `@swmansion/react-native-bottom-sheet` via `AppModalBottomSheet` for native animations and
 * interactive drag-to-dismiss.
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
  const { height } = useWindowDimensions();

  return (
    <AppModalBottomSheet
      index={visible ? 1 : 0}
      detents={size === 'full' ? [0, '92%'] : [0, 'content']}
      onClose={onClose}
    >
      <AppKeyboardAvoidingView flex={size === 'full'} behavior="padding">
        <AppView className={cn(size === 'full' && 'flex-1', 'pb-safe-offset-3')}>
          <AppView className="items-center pb-2 pt-2.5">
            <AppView className="h-1 w-9 rounded-full bg-border-strong" />
          </AppView>
          <AppView row className="items-start px-5 pb-3 pt-1">
            <AppView className="flex-1 pr-3">
              <AppText accessibilityRole="header" className="text-[20px] font-bold text-foreground">
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
          <AppScrollView
            flex={size === 'full'}
            style={size === 'full' ? undefined : { maxHeight: height * MAX_CONTENT_SHARE }}
            contentContainerClassName="px-5 pb-3"
          >
            {children}
          </AppScrollView>
          {footer ? <AppView className="px-5 pt-2">{footer}</AppView> : null}
        </AppView>
      </AppKeyboardAvoidingView>
    </AppModalBottomSheet>
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
