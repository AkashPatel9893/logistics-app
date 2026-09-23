import { AppPressable, AppText, AppView, Card, Icon, type IconName } from '@/components/ui';

export interface QuickActionCardProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export function QuickActionCard({ icon, label, onPress }: QuickActionCardProps) {
  return (
    <AppPressable onPress={onPress} accessibilityLabel={label} className="flex-1">
      <Card className="items-start">
        <AppView center className="mb-4 size-9 rounded-full border border-border-strong">
          <Icon name={icon} size={16} />
        </AppView>
        <AppText className="text-[15px] font-bold text-foreground">{label}</AppText>
      </Card>
    </AppPressable>
  );
}
