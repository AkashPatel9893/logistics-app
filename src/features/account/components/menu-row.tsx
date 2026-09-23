import { AppPressable, AppText, Card, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface MenuRowProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function MenuRow({ label, onPress, destructive = false }: MenuRowProps) {
  return (
    <AppPressable onPress={onPress} accessibilityLabel={label} className="mb-3">
      <Card
        className={cn(
          'flex-row items-center justify-between',
          destructive && 'border-danger-border bg-danger-soft',
        )}
      >
        <AppText
          className={cn('text-[15px] font-bold', destructive ? 'text-danger' : 'text-foreground')}
        >
          {label}
        </AppText>
        <Icon name="chevron.right" size={15} tone={destructive ? 'danger' : 'icon-subtle'} />
      </Card>
    </AppPressable>
  );
}
