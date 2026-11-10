import type { ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedView, AppView, Icon } from '@/components/ui';
import { DURATION } from '@/lib/motion';

/** Every stop row is this tall (connector + field), so a drag maps to a position by division. */
export const STOP_ROW_HEIGHT = 84;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** Where the dragged row would land if it were dropped now. */
function hoveredIndex(from: number, offsetY: number, count: number) {
  'worklet';
  return clamp(Math.round(from + offsetY / STOP_ROW_HEIGHT), 0, count - 1);
}

export interface DraggableStopRowProps {
  index: number;
  count: number;
  /** Index of the row being dragged, or -1. Shared by every row of the list. */
  dragIndex: SharedValue<number>;
  dragOffset: SharedValue<number>;
  onMove: (from: number, to: number) => void;
  accessibilityLabel: string;
  children: ReactNode;
}

/**
 * One stop of a reorderable list: drag the handle to move it, like Porter's
 * Add Stops. The other rows slide aside to show where it will land.
 */
export function DraggableStopRow({
  index,
  count,
  dragIndex,
  dragOffset,
  onMove,
  accessibilityLabel,
  children,
}: DraggableStopRowProps) {
  const pan = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .onStart(() => {
      dragIndex.set(index);
      dragOffset.set(0);
    })
    .onChange((event) => {
      dragOffset.set(
        clamp(
          dragOffset.get() + event.changeY,
          -index * STOP_ROW_HEIGHT,
          (count - 1 - index) * STOP_ROW_HEIGHT,
        ),
      );
    })
    .onFinalize(() => {
      if (dragIndex.get() !== index) return;
      const to = hoveredIndex(index, dragOffset.get(), count);
      dragIndex.set(-1);
      dragOffset.set(0);
      if (to !== index) scheduleOnRN(onMove, index, to);
    });

  const style = useAnimatedStyle(() => {
    const from = dragIndex.get();
    if (from === index) {
      return { zIndex: 10, transform: [{ translateY: dragOffset.get() }, { scale: 1.02 }] };
    }
    let shift = 0;
    if (from >= 0) {
      const to = hoveredIndex(from, dragOffset.get(), count);
      if (from < index && index <= to) shift = -STOP_ROW_HEIGHT;
      else if (to <= index && index < from) shift = STOP_ROW_HEIGHT;
    }
    return {
      zIndex: 0,
      transform: [{ translateY: withTiming(shift, { duration: DURATION.small }) }, { scale: 1 }],
    };
  });

  return (
    <AnimatedView style={[{ height: STOP_ROW_HEIGHT }, style]}>
      <AppView className="flex-1 flex-row items-end">
        <AppView className="flex-1">{children}</AppView>
        {count > 1 ? (
          <GestureDetector gesture={pan}>
            <AppView
              accessibilityRole="adjustable"
              accessibilityLabel={accessibilityLabel}
              // Screen readers can't drag: swiping up or down on the handle moves the stop one place.
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(event) => {
                const to = event.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
                if (to >= 0 && to < count) onMove(index, to);
              }}
              className="h-[60px] w-9 items-center justify-center"
            >
              <Icon name="line.3.horizontal" size={20} tone="icon-subtle" />
            </AppView>
          </GestureDetector>
        ) : null}
      </AppView>
    </AnimatedView>
  );
}
