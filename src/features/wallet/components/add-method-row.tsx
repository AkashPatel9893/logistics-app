import type { ReactNode } from 'react';

import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { cn } from '@/lib/cn';
import { DURATION } from '@/lib/motion';
import type { PaymentMethodType } from '@/lib/api/models';

import { MethodIcon } from './method-icon';

export interface AddMethodRowProps {
  type: PaymentMethodType;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onPress: () => void;
  /** Form shown when the row is expanded. */
  children?: ReactNode;
}

export function AddMethodRow({
  type,
  title,
  subtitle,
  isOpen,
  onPress,
  children,
}: AddMethodRowProps) {
  const layout = useLayoutTransition();

  return (
    <AnimatedView
      layout={layout}
      className={cn(
        'mb-3 overflow-hidden rounded-2xl border bg-surface',
        isOpen ? 'border-brand' : 'border-divider',
      )}
    >
      <AppPressable
        onPress={onPress}
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
        className="flex-row items-center p-4"
      >
        <MethodIcon type={type} />
        <AppView className="ml-3 flex-1">
          <AppText className="text-[15px] font-bold text-foreground">{title}</AppText>
          <AppText className="mt-0.5 text-[12px] text-muted">{subtitle}</AppText>
        </AppView>
        <Icon name={isOpen ? 'chevron.up' : 'chevron.right'} size={14} tone="icon-subtle" />
      </AppPressable>
      {isOpen ? (
        <AnimatedView
          entering={FadeIn.duration(DURATION.small)}
          exiting={FadeOut.duration(DURATION.press)}
          className="px-4 pb-4"
        >
          {children}
        </AnimatedView>
      ) : null}
    </AnimatedView>
  );
}
