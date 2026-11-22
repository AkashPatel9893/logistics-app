import { useState } from 'react';

import { AppPressable, AppText, AppView, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { GestureScrollView } from '@/lib/gesture';
import { useSharedValue } from '@/lib/motion';
import { type DraftStop, type TripDraft } from '@/stores';

import { placeLine } from '../place-line';
import { DraggableStopRow } from './draggable-stop-row';
import { StopBadge } from './stop-badge';
import { StopConnector } from './stop-connector';

interface FloatingStopsCardProps {
  mode?: 'add' | 'edit';
  draft: TripDraft;
  stops: DraftStop[];
  maxDrops: number;
  pickupContact: string;
  listMaxHeight: number;
  onLayoutHeight: (height: number) => void;
  onBack: () => void;
  onPressPickup: () => void;
  onPressStop: (index: number) => void;
  onMoveStop: (from: number, to: number) => void;
  onRemoveStop: (index: number) => void;
  onAddStop: () => void;
}

export function FloatingStopsCard({
  mode,
  draft,
  stops,
  maxDrops,
  pickupContact,
  listMaxHeight,
  onLayoutHeight,
  onBack,
  onPressPickup,
  onPressStop,
  onMoveStop,
  onRemoveStop,
  onAddStop,
}: FloatingStopsCardProps) {
  const dragIndex = useSharedValue(-1);
  const dragOffset = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <AppView
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 px-3 pt-safe-offset-2"
      onLayout={(event) => onLayoutHeight(Math.round(event.nativeEvent.layout.height))}
    >
      <AppView className="rounded-[28px] bg-surface shadow-floating">
        <AppView row className="items-center px-3 pb-2 pt-3">
          <AppPressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={6}
            className="size-10 items-center justify-center rounded-full bg-surface-muted"
          >
            <Icon name="chevron.left" size={20} tone="foreground" weight="semibold" />
          </AppPressable>
          <AppView className="ml-3 flex-1">
            <AppText accessibilityRole="header" className="text-[18px] font-bold text-foreground">
              {mode === 'edit' ? 'Edit Locations' : 'Add Stops'}
            </AppText>
            <AppText className="text-[12px] text-muted">
              {stops.length > 1 ? 'Hold ≡ and drag to change the order' : 'Pickup and drop'}
            </AppText>
          </AppView>
          <AppView className="rounded-full bg-brand-soft px-2.5 py-1">
            <AppText className="text-[11.5px] font-bold text-brand-strong">
              {stops.length}/{maxDrops} drops
            </AppText>
          </AppView>
        </AppView>

        <GestureScrollView
          style={{ maxHeight: listMaxHeight }}
          contentContainerClassName="px-3.5 pb-2 pt-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          bounces={false}
          scrollEnabled={!isDragging}
        >
          <AppView className="flex-row items-center gap-3">
            <StopBadge kind="pickup" />
            <AppPressable
              onPress={onPressPickup}
              accessibilityRole="button"
              accessibilityLabel={`Pickup: ${draft.pickupLabel || 'not set'}. Tap to change.`}
              className="h-[60px] flex-1 justify-center rounded-2xl bg-surface-muted px-3.5"
            >
              {pickupContact ? (
                <AppText numberOfLines={1} className="text-[14px] font-bold text-foreground">
                  {pickupContact}
                </AppText>
              ) : null}
              <AppText numberOfLines={1} className="text-[13px] text-muted">
                {placeLine(draft.pickupLabel, draft.pickupAddress) || 'Pickup location'}
              </AppText>
            </AppPressable>
            {stops.length > 1 ? <AppView className="w-9" /> : null}
          </AppView>

          {stops.map((stop, index) => {
            const isFinal = index === stops.length - 1;
            const contact = [stop.details?.contactName, stop.details?.contactPhone]
              .filter(Boolean)
              .join(' · ');
            return (
              <DraggableStopRow
                key={`${index}:${stop.label}`}
                index={index}
                count={stops.length}
                dragIndex={dragIndex}
                dragOffset={dragOffset}
                onMove={onMoveStop}
                onDragChange={setIsDragging}
                accessibilityLabel={`Reorder stop ${index + 1}`}
              >
                <StopConnector className="ml-[13px]" />
                <AppView className="flex-row items-center gap-3">
                  <StopBadge kind={isFinal ? 'final' : 'stop'} number={index + 1} />
                  <AppPressable
                    onPress={() => onPressStop(index)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      stop.label
                        ? `Stop ${index + 1}: ${stop.label}. Tap to change.`
                        : `Choose stop ${index + 1}`
                    }
                    className={cn(
                      'h-[60px] flex-1 flex-row items-center rounded-2xl bg-surface-muted pl-3.5',
                      stop.region && !stop.details && 'border border-amber-500',
                    )}
                  >
                    <AppView className="flex-1">
                      {stop.label ? (
                        <>
                          <AppText
                            numberOfLines={1}
                            className="text-[14px] font-bold text-foreground"
                          >
                            {contact || 'Add receiver details'}
                          </AppText>
                          <AppText numberOfLines={1} className="text-[13px] text-muted">
                            {placeLine(stop.label, stop.address)}
                          </AppText>
                        </>
                      ) : (
                        <AppText className="text-[14px] font-medium text-subtle">
                          {isFinal
                            ? 'Where is your Final Destination?'
                            : `Where is your Stop ${index + 1}?`}
                        </AppText>
                      )}
                    </AppView>
                    {stops.length > 1 ? (
                      <AppPressable
                        onPress={() => onRemoveStop(index)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove stop ${index + 1}`}
                        className="h-full justify-center px-3"
                      >
                        <Icon name="xmark.circle.fill" size={18} tone="icon-faint" />
                      </AppPressable>
                    ) : null}
                  </AppPressable>
                </AppView>
              </DraggableStopRow>
            );
          })}
        </GestureScrollView>

        <AppView className="mx-4 h-px bg-divider" />
        {stops.length < maxDrops ? (
          <AppPressable
            onPress={onAddStop}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 py-3.5"
          >
            <Icon name="plus.circle.fill" size={18} tone="brand" />
            <AppText className="text-[14px] font-bold text-brand">Add Stop</AppText>
          </AppPressable>
        ) : (
          <AppText className="py-3.5 text-center text-[12px] text-subtle">
            That&apos;s the most stops for one trip ({maxDrops}).
          </AppText>
        )}
      </AppView>
    </AppView>
  );
}
