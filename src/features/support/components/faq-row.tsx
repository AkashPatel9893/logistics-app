import { useState } from 'react';

import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { DURATION } from '@/lib/motion';

/** Chevron that rotates to point up when the row is open. */
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatedView
      style={{
        transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
        transitionProperty: 'transform',
        transitionDuration: DURATION.small,
      }}
    >
      <Icon name="chevron.down" size={13} tone="icon-subtle" />
    </AnimatedView>
  );
}

export interface FaqRowProps {
  question: string;
  answer: string;
}

export function FaqRow({ question, answer }: FaqRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Rows below slide (rather than jump) as an answer opens or closes.
  const layout = useLayoutTransition();

  return (
    <AnimatedView layout={layout}>
      <AppPressable
        onPress={() => setIsOpen((open) => !open)}
        accessibilityState={{ expanded: isOpen }}
        className="border-b border-divider py-3.5"
      >
        <AppView row className="justify-between">
          <AppText className="flex-1 pr-3 text-[14px] font-semibold text-foreground">
            {question}
          </AppText>
          <ChevronIcon isOpen={isOpen} />
        </AppView>
        {isOpen ? (
          <AnimatedView
            entering={FadeIn.duration(DURATION.small)}
            exiting={FadeOut.duration(DURATION.press)}
          >
            <AppText className="mt-2 text-[13px] leading-[19px] text-muted">{answer}</AppText>
          </AnimatedView>
        ) : null}
      </AppPressable>
    </AnimatedView>
  );
}
