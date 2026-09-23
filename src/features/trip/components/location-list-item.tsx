import { AppPressable, AppText, AppView, Icon, IconBadge, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { DisplayAddress } from '../hooks/use-address-search';

const ICON_FOR_TYPE: Record<DisplayAddress['iconType'], IconName> = {
  work: 'briefcase',
  home: 'house',
  search: 'mappin.circle.fill',
  recent: 'clock',
  other: 'clock',
};

export interface LocationListItemProps {
  item: DisplayAddress;
  isSelected: boolean;
  onPress: (item: DisplayAddress) => void;
  onEdit: (item: DisplayAddress) => void;
  onToggleFavorite: (id: string) => void;
}

export function LocationListItem({
  item,
  isSelected,
  onPress,
  onEdit,
  onToggleFavorite,
}: LocationListItemProps) {
  return (
    <AppPressable
      onPress={() => onPress(item)}
      accessibilityLabel={`${item.name}, ${item.address}`}
      accessibilityState={{ selected: isSelected }}
      className={cn('flex-row items-center px-4 py-3.5', isSelected && 'bg-brand-tint')}
    >
      <IconBadge
        name={ICON_FOR_TYPE[item.iconType]}
        tone={item.iconType === 'search' ? 'brand' : 'icon'}
      />
      <AppView className="ml-3 flex-1">
        <AppText className="mb-0.5 text-[15px] font-semibold text-foreground">{item.name}</AppText>
        <AppText numberOfLines={1} className="text-[13px] text-subtle">
          {item.address}
        </AppText>
      </AppView>

      {item.isSaved ? (
        <AppPressable
          onPress={() => onEdit(item)}
          hitSlop={10}
          accessibilityLabel={`Edit ${item.name}`}
          className="ml-2"
        >
          <Icon name="pencil" size={17} tone="icon-subtle" />
        </AppPressable>
      ) : null}

      {item.isSaved ? (
        <AppPressable
          onPress={() => onToggleFavorite(item.id)}
          hitSlop={10}
          accessibilityLabel={item.isFavorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`}
          className="ml-3"
        >
          <Icon
            name={item.isFavorite ? 'heart.fill' : 'heart'}
            size={20}
            tone={item.isFavorite ? 'brand' : 'icon-faint'}
          />
        </AppPressable>
      ) : null}
    </AppPressable>
  );
}
