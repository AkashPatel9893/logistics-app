import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { DisplayAddress } from '../hooks/use-address-search';

export interface LocationListItemProps {
  item: DisplayAddress;
  isSelected: boolean;
  /** Straight-line distance from the pickup, when both are known. */
  distanceKm?: number | null;
  onPress: (item: DisplayAddress) => void;
  onEdit?: (item: DisplayAddress) => void;
  onToggleFavorite: (item: DisplayAddress) => void;
}

export function LocationListItem({
  item,
  isSelected,
  distanceKm,
  onPress,
  onToggleFavorite,
}: LocationListItemProps) {
  const isSavedOrFav = item.isFavorite || item.isSaved;

  return (
    <AppPressable
      onPress={() => onPress(item)}
      accessibilityLabel={`${item.name}, ${item.address}`}
      accessibilityState={{ selected: isSelected }}
      className={cn(
        'flex-row items-center px-4 py-3.5',
        isSelected ? 'bg-brand-tint/60' : 'active:bg-surface-elevated/50',
      )}
    >
      {/* Clock icon on left matching reference */}
      <AppView className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
        <Icon name="clock" size={20} tone="icon-subtle" />
      </AppView>

      {/* Main content: Title + Contact Tag Badge on row 1, address on row 2 */}
      <AppView className="flex-1 justify-center">
        <AppView className="flex-row items-center flex-wrap">
          <AppText numberOfLines={1} className="text-[15px] font-bold text-foreground">
            {item.name}
          </AppText>

          {item.contactName && item.contactName.toUpperCase() !== 'OTHER' ? (
            <AppView className="ml-2 flex-row items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-border/40">
              <Icon name="person.fill" size={10} tone="foreground" />
              <AppText className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                {item.contactName}
              </AppText>
            </AppView>
          ) : null}
        </AppView>

        <AppText numberOfLines={1} className="mt-1 text-[13px] text-subtle">
          {distanceKm != null ? (
            <AppText className="text-[13px] font-semibold text-foreground-secondary">
              {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km ·{' '}
            </AppText>
          ) : null}
          {item.address}
        </AppText>
      </AppView>

      {/* Right side: Heart icon with "SAVE" text underneath */}
      <AppPressable
        onPress={() => onToggleFavorite(item)}
        hitSlop={12}
        accessibilityLabel={isSavedOrFav ? `Unsave ${item.name}` : `Save ${item.name}`}
        className="items-center justify-center pl-3 min-w-[44px]"
      >
        <Icon
          name={isSavedOrFav ? 'heart.fill' : 'heart'}
          size={22}
          tone={isSavedOrFav ? 'brand' : 'icon-subtle'}
        />
        <AppText
          className={cn(
            'mt-0.5 text-[9px] font-bold uppercase tracking-wider',
            isSavedOrFav ? 'text-brand' : 'text-subtle',
          )}
        >
          {isSavedOrFav ? 'SAVED' : 'SAVE'}
        </AppText>
      </AppPressable>
    </AppPressable>
  );
}
