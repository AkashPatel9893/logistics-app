import { AppPressable, AppText, Card, Icon, type IconName } from '@/components/ui';

export interface ContactButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export function ContactButton({ icon, label, onPress }: ContactButtonProps) {
  return (
    <AppPressable onPress={onPress} accessibilityLabel={label} className="flex-1">
      <Card variant="outline" className="items-center border-divider py-4">
        <Icon name={icon} size={20} tone="brand" />
        <AppText className="mt-2 text-[13px] font-semibold text-foreground">{label}</AppText>
      </Card>
    </AppPressable>
  );
}
