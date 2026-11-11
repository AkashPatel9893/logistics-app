import { AppText, AppView, Button, Icon } from '@/components/ui';

import { BookingSheet } from './booking-sheet';

/** Items that can't be sent; shown on the goods sheet and from "View list". */
export const RESTRICTED_ITEMS: readonly string[] = [
  'Narcotics & illegal drugs',
  'Explosives',
  'Firearms',
  'Flammables',
  'Dangerous goods',
  'Hazardous goods',
  'Radioactive materials',
  'Dry ice',
  'Illegal goods',
  'Livestock',
  'Pets & animals',
  'Human body parts',
  'Pornographic materials',
  'Precious jewellery',
  'Stones & gems',
  'Currency & coins',
  'Gambling devices',
  'Lottery tickets',
  'Fire extinguishers',
  'Cigarettes & alcohol',
];

/** Two even columns of the restricted items. */
export function RestrictedItemsList() {
  const half = Math.ceil(RESTRICTED_ITEMS.length / 2);
  const columns = [RESTRICTED_ITEMS.slice(0, half), RESTRICTED_ITEMS.slice(half)];
  return (
    <AppView row className="gap-3">
      {columns.map((column, index) => (
        <AppView key={index} className="flex-1 gap-2">
          {column.map((item) => (
            <AppView key={item} row className="items-start">
              <AppView className="mr-2 mt-[7px] size-1.5 rounded-full bg-error" />
              <AppText className="flex-1 text-[13px] leading-[19px] text-foreground-secondary">
                {item}
              </AppText>
            </AppView>
          ))}
        </AppView>
      ))}
    </AppView>
  );
}

export interface RestrictedItemsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function RestrictedItemsSheet({ visible, onClose }: RestrictedItemsSheetProps) {
  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      size="full"
      title="Restricted items"
      footer={<Button label="Okay, understood" className="h-14" onPress={onClose} />}
    >
      <AppView row className="mb-4 items-center overflow-hidden rounded-[22px] bg-amber-500/12 p-4">
        <AppText className="flex-1 pr-3 text-[15px] font-semibold leading-[21px] text-foreground">
          Your order should not contain any of these items
        </AppText>
        <AppView center className="size-14 rounded-full bg-error/15">
          <AppView center className="size-10 rounded-full bg-error">
            <Icon name="lock.fill" size={18} color="#FFFFFF" />
          </AppView>
        </AppView>
      </AppView>
      <RestrictedItemsList />
    </BookingSheet>
  );
}
