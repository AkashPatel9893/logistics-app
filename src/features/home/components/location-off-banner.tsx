import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView, AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { DURATION } from '@/lib/motion';

export interface LocationOffBannerProps {
  /** Phone location off, or Ryno not allowed to use it. */
  reason: 'services-off' | 'permission';
  onPress: () => void;
}

const COPY = {
  'services-off': {
    title: 'Device location is off',
    subtitle: 'Turn it on to detect your pickup point automatically',
    action: 'Turn on',
  },
  permission: {
    title: 'Location access not allowed',
    subtitle: 'Allow access to detect your pickup point automatically',
    action: 'Allow',
  },
} as const;

/** Shown on Home while the app can't use location, with the one-tap fix. */
export function LocationOffBanner({ reason, onPress }: LocationOffBannerProps) {
  const copy = COPY[reason];
  return (
    <AnimatedView
      entering={FadeIn.duration(DURATION.enter)}
      exiting={FadeOut.duration(DURATION.small)}
      className="mx-4 mt-3"
    >
      <AppPressable
        onPress={onPress}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${copy.title}. ${copy.subtitle}`}
        accessibilityHint={copy.action}
        className="flex-row items-center rounded-2xl border border-amber-500/30 bg-amber-50 px-3.5 py-3 dark:bg-amber-500/10"
      >
        <AppView center className="mr-3 size-9 rounded-full bg-amber-500/15">
          <Icon name="location" size={18} color="#D97706" />
        </AppView>
        <AppView className="flex-1 pr-2">
          <AppText className="text-[14px] font-bold text-foreground">{copy.title}</AppText>
          <AppText numberOfLines={2} className="mt-0.5 text-[12px] text-muted">
            {copy.subtitle}
          </AppText>
        </AppView>
        <AppView className="rounded-full bg-neutral-900 px-3.5 py-2 dark:bg-white">
          <AppText className="text-[13px] font-bold text-white dark:text-neutral-900">
            {copy.action}
          </AppText>
        </AppView>
      </AppPressable>
    </AnimatedView>
  );
}
