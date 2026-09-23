import { AppPressable, AppText, AppView, Card, IconBadge, type IconName } from '@/components/ui';

export interface PromoCardProps {
  title: string;
  subtitle: string;
  icon: IconName;
  /** Background class for the icon tile, e.g. `bg-brand-soft`. */
  iconBackgroundClassName: string;
  onPress: () => void;
}

export function PromoCard({
  title,
  subtitle,
  icon,
  iconBackgroundClassName,
  onPress,
}: PromoCardProps) {
  return (
    <AppPressable onPress={onPress} accessibilityLabel={title} className="mb-3">
      <Card className="flex-row items-center">
        <AppView className="flex-1 pr-3">
          <AppText className="text-[15px] font-bold text-foreground">{title}</AppText>
          <AppText className="mt-1 text-[13px] leading-[18px] text-muted">{subtitle}</AppText>
        </AppView>
        <IconBadge
          name={icon}
          tone="brand"
          className={`size-11 rounded-2xl ${iconBackgroundClassName}`}
        />
      </Card>
    </AppPressable>
  );
}
