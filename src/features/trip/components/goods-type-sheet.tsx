import { BottomSheet, Host, RNHostView } from '@expo/ui';
import { useWindowDimensions } from 'react-native';

import { AppPressable, AppText, AppView, Icon, type IconName } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/cn';

export interface GoodsType {
  /** Sent to the backend as the consignment item's category. */
  category: string;
  label: string;
  icon: IconName;
}

export const GOODS_TYPES: readonly GoodsType[] = [
  { category: 'FURNITURE', label: 'Furniture & home items', icon: 'house.fill' },
  { category: 'ELECTRONICS', label: 'Electronics & appliances', icon: 'iphone' },
  { category: 'BUILDING_MATERIALS', label: 'Building materials', icon: 'box.truck.fill' },
  { category: 'FMCG', label: 'Groceries & FMCG', icon: 'storefront.fill' },
  { category: 'FOOD', label: 'Food & homemade items', icon: 'heart.fill' },
  { category: 'DOCUMENTS', label: 'Documents & small parcels', icon: 'envelope.fill' },
  { category: 'TEXTILES', label: 'Clothes & textiles', icon: 'tag.fill' },
  { category: 'PERSONAL', label: 'Gifts & personal items', icon: 'gift.fill' },
  { category: 'OTHER', label: 'Something else', icon: 'shippingbox.fill' },
];

export interface GoodsTypeSheetProps {
  isPresented: boolean;
  selected: GoodsType | null;
  onSelect: (goods: GoodsType) => void;
  onDismiss: () => void;
}

/** "What are you sending?": one tap picks the goods type and closes the sheet. */
export function GoodsTypeSheet({
  isPresented,
  selected,
  onSelect,
  onDismiss,
}: GoodsTypeSheetProps) {
  const surfaceColor = useThemeColor('surface');
  const { width } = useWindowDimensions();

  if (!isPresented) return null;

  return (
    <Host style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BottomSheet
        isPresented={isPresented}
        onDismiss={onDismiss}
        snapPoints={['full']}
        showDragIndicator
        contentPadding={0}
        containerColor={surfaceColor}
      >
        {/* RN content in the native sheet must sit in an RNHostView, or Android drops the taps. */}
        <RNHostView matchContents>
          <AppView className="bg-surface px-4 pb-8 pt-2" style={{ width }}>
            <AppText
              accessibilityRole="header"
              className="px-1 text-[20px] font-bold text-foreground"
            >
              What are you sending?
            </AppText>
            <AppText className="mb-3 mt-0.5 px-1 text-[13px] text-muted">
              It helps the driver handle your goods the right way.
            </AppText>

            <AppView row className="mb-3 items-center rounded-2xl bg-amber-500/10 px-3 py-2.5">
              <Icon name="lock.fill" size={14} color="#d97706" />
              <AppText className="ml-2 flex-1 text-[12px] font-medium text-foreground">
                Drugs, weapons, explosives and flammable items can&apos;t be sent.
              </AppText>
            </AppView>

            <AppView className="gap-2">
              {GOODS_TYPES.map((goods) => {
                const isSelected = selected?.category === goods.category;
                return (
                  <AppPressable
                    key={goods.category}
                    onPress={() => {
                      onSelect(goods);
                      onDismiss();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={goods.label}
                    pressScale={0.98}
                    className={cn(
                      'flex-row items-center rounded-2xl border px-3 py-3',
                      isSelected ? 'border-brand bg-brand-soft' : 'border-border/70 bg-surface',
                    )}
                  >
                    <AppView
                      center
                      className={cn(
                        'mr-3 size-10 rounded-xl',
                        isSelected ? 'bg-brand' : 'bg-surface-muted',
                      )}
                    >
                      <Icon
                        name={goods.icon}
                        size={18}
                        tone={isSelected ? 'brand-foreground' : 'foreground'}
                      />
                    </AppView>
                    <AppText className="flex-1 text-[15px] font-semibold text-foreground">
                      {goods.label}
                    </AppText>
                    {isSelected ? (
                      <Icon name="checkmark.circle.fill" size={20} tone="brand" />
                    ) : null}
                  </AppPressable>
                );
              })}
            </AppView>
          </AppView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
