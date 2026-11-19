import { AppText, AppView } from '@/components/ui';
import { BookingSheet } from '@/components/booking-sheet';

export interface RestrictedItemsSheetProps {
  visible: boolean;
  items: readonly string[];
  onClose: () => void;
}

export function RestrictedItemsSheet({ visible, items, onClose }: RestrictedItemsSheetProps) {
  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      title="Restricted items"
      subtitle="These can't be sent with Ryno."
    >
      <AppView className="gap-2.5 pb-2">
        {items.map((item) => (
          <AppView key={item} row className="items-start">
            <AppText className="mr-2 text-[15px] text-muted">•</AppText>
            <AppText className="flex-1 text-[15px] text-foreground">{item}</AppText>
          </AppView>
        ))}
      </AppView>
    </BookingSheet>
  );
}
