import { useState } from 'react';

import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import { AppView, Button, type IconName } from '@/components/ui';

export interface GoodsType {
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

export function GoodsTypeSheet({ visible, value, onConfirm, onClose }: GoodsTypeSheetProps) {
  const [picked, setPicked] = useState<GoodsType | null>(value);

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setPicked(value);
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
