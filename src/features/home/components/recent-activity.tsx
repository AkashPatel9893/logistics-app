import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Icon,
  type IconName,
} from '@/components/ui';
import type { DisplayAddress } from '@/features/trip/hooks/use-address-search';
import {
  Easing,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from '@/lib/motion';
import { useWindowDimensions } from '@/lib/native';

export interface RecentActivityProps {
  recentDrops: DisplayAddress[];
  onSelectDrop: (drop: DisplayAddress) => void;
  scrollY: SharedValue<number>;
}

const STEPS: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'mappin',
    title: 'Set pickup and drop',
    body: 'Search an address or pin it on the map, and add who to contact.',
  },
  {
    icon: 'box.truck.fill',
    title: 'Choose a vehicle',
    body: 'See the price for each vehicle before you book.',
  },
  {
    icon: 'checkmark.circle.fill',
    title: 'Track and share the code',
    body: 'Follow your driver live. Give the pickup and delivery codes only at handover.',
  },
];

const STEP_COUNT = STEPS.length;
const TRAVEL_MS = 2400;

interface StepRowProps {
  index: number;
  icon: IconName;
  title: string;
  body: string;
  progress: SharedValue<number>;
}

function StepRow({ index, icon, title, body, progress }: StepRowProps) {
  const isLast = index === STEP_COUNT - 1;
  const from = index / (STEP_COUNT - 1);
  const to = (index + 1) / (STEP_COUNT - 1);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [from - 0.08, from], [0, 1], 'clamp'),
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [from - 0.08, from], [0.45, 1], 'clamp'),
  }));
  const lineStyle = useAnimatedStyle(() => ({
    height: `${interpolate(progress.get(), [from, to], [0, 100], 'clamp')}%`,
  }));

  return (
    <AppView className="flex-row">
      <AppView className="mr-4 items-center">
        <AppView center className="size-11 rounded-full bg-surface-muted">
          <Icon name={icon} size={20} tone="icon-subtle" />
          <AnimatedView
            center
            className="absolute inset-0 rounded-full bg-inverse"
            style={dotStyle}
          >
            <Icon name={icon} size={20} tone="inverse-foreground" />
          </AnimatedView>
        </AppView>
        {isLast ? null : (
          <AppView className="my-1.5 w-0.5 flex-1 overflow-hidden rounded-full bg-border">
            <AnimatedView className="w-full bg-inverse" style={lineStyle} />
          </AppView>
        )}
      </AppView>
      <AnimatedView className={isLast ? 'flex-1' : 'flex-1 pb-6'} style={textStyle}>
        <AppText className="mt-0.5 text-[15.5px] font-bold text-foreground">{title}</AppText>
        <AppText className="mt-0.5 text-[13px] leading-[19px] text-muted">{body}</AppText>
      </AnimatedView>
    </AppView>
  );
}

function HowItWorks({ scrollY }: { scrollY: SharedValue<number> }) {
  const reducedMotion = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  const sectionTop = useSharedValue(Number.POSITIVE_INFINITY);
  const played = useSharedValue(reducedMotion);

  useAnimatedReaction(
    () => scrollY.get() + windowHeight * 0.8 - sectionTop.get(),
    (visibleDepth) => {
      if (played.get() || visibleDepth < 0) return;
      played.set(true);
      progress.set(withTiming(1, { duration: TRAVEL_MS, easing: Easing.inOut(Easing.quad) }));
    },
  );

  return (
    <AppView className="mt-7 px-5" onLayout={(e) => sectionTop.set(e.nativeEvent.layout.y)}>
      <AppText accessibilityRole="header" className="mb-3.5 text-[20px] font-bold text-foreground">
        How it works
      </AppText>
      <AppView className="rounded-[24px] border border-border/70 bg-surface p-5">
        {STEPS.map((step, index) => (
          <StepRow
            key={step.title}
            index={index}
            icon={step.icon}
            title={step.title}
            body={step.body}
            progress={progress}
          />
        ))}
      </AppView>
    </AppView>
  );
}

export function RecentActivity({ recentDrops, onSelectDrop, scrollY }: RecentActivityProps) {
  if (recentDrops.length === 0) return <HowItWorks scrollY={scrollY} />;

  return (
    <AppView className="mt-7">
      <AppText
        accessibilityRole="header"
        className="mb-3.5 px-5 text-[20px] font-bold text-foreground"
      >
        Send again
      </AppText>
      <AppScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2.5 px-5"
      >
        {recentDrops.map((drop) => (
          <AppPressable
            key={drop.id}
            onPress={() => onSelectDrop(drop)}
            accessibilityLabel={`Send to ${drop.name}`}
            className="w-[176px] rounded-[22px] border border-border/70 bg-surface p-3.5"
          >
            <AppView row className="mb-2.5 items-center justify-between">
              <AppView center className="size-9 rounded-[12px] bg-brand-soft">
                <Icon name="mappin" size={16} tone="brand" />
              </AppView>
              <Icon name="arrow.right" size={14} tone="icon-subtle" />
            </AppView>
            <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
              {drop.name}
            </AppText>
            {drop.address ? (
              <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-muted">
                {drop.address}
              </AppText>
            ) : null}
          </AppPressable>
        ))}
      </AppScrollView>
    </AppView>
  );
}
