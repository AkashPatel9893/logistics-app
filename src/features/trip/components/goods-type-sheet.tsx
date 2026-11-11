import { useState } from 'react';

import {
  AppPressable,
  AppText,
  AppView,
  Button,
  Icon,
  IconBadge,
  type IconName,
} from '@/components/ui';

import { BookingSheet, SheetOption } from './booking-sheet';
import { RestrictedItemsList } from './restricted-items-sheet';

export interface GoodsType {
  /** Sent to the backend as the consignment item's category. */
  category: string;
  label: string;
  icon: IconName;
}

export const GOODS_TYPES: readonly GoodsType[] = [
  { category: 'BUILDING_MATERIALS', label: 'Building materials', icon: 'box.truck.fill' },
  { category: 'FURNITURE', label: 'Furniture & home items', icon: 'house.fill' },
  { category: 'ELECTRONICS', label: 'Electronics & appliances', icon: 'iphone' },
  { category: 'FMCG', label: 'Groceries & FMCG', icon: 'storefront.fill' },
  { category: 'FOOD', label: 'Food & homemade items', icon: 'heart.fill' },
  { category: 'DOCUMENTS', label: 'Documents & small parcels', icon: 'envelope.fill' },
  { category: 'TEXTILES', label: 'Clothes & textiles', icon: 'tag.fill' },
  { category: 'PERSONAL', label: 'Gifts & personal items', icon: 'gift.fill' },
  { category: 'OTHER', label: 'Something else', icon: 'shippingbox.fill' },
];

export interface GoodsTypeSheetProps {
  visible: boolean;
  value: GoodsType | null;
  onConfirm: (goods: GoodsType) => void;
  onClose: () => void;
}

/** Like Porter: the restricted list up top (folds open), the goods types, then Confirm. */
export function GoodsTypeSheet({ visible, value, onConfirm, onClose }: GoodsTypeSheetProps) {
  const [picked, setPicked] = useState<GoodsType | null>(value);
  const [showRestricted, setShowRestricted] = useState(false);

  // Opening again starts from what's saved, not from an abandoned pick.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPicked(value);
      setShowRestricted(false);
    }
  }

  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      size="full"
      title="Select goods type"
      footer={
        <Button
          label="Confirm"
          className="h-14"
          disabled={!picked}
          onPress={() => {
            if (!picked) return;
            onConfirm(picked);
            onClose();
          }}
        />
      }
    >
      <AppView className="mb-3 overflow-hidden rounded-[22px] bg-amber-500/12">
        <AppPressable
          onPress={() => setShowRestricted((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showRestricted }}
          className="flex-row items-center p-3.5"
        >
          <IconBadge name="lock.fill" tone="danger" className="mr-3 rounded-xl bg-surface" />
          <AppView className="flex-1">
            <AppText className="text-[15px] font-bold text-foreground">Restricted items</AppText>
            <AppText className="mt-0.5 text-[12px] text-muted">
              Narcotics, explosives & more
            </AppText>
          </AppView>
          <AppText className="mr-1 text-[13px] font-bold text-brand-strong">
            {showRestricted ? 'Hide' : 'See all'}
          </AppText>
          <Icon name={showRestricted ? 'chevron.up' : 'chevron.down'} size={14} tone="brand" />
        </AppPressable>
        {showRestricted ? (
          <AppView className="mx-3.5 border-t border-dashed border-amber-600/40 pb-3.5 pt-3">
            <RestrictedItemsList />
          </AppView>
        ) : null}
      </AppView>

      <AppView className="gap-2">
        {GOODS_TYPES.map((goods) => (
          <SheetOption
            key={goods.category}
            label={goods.label}
            icon={goods.icon}
            selected={picked?.category === goods.category}
            onPress={() => setPicked(goods)}
          />
        ))}
      </AppView>
    </BookingSheet>
  );
}
