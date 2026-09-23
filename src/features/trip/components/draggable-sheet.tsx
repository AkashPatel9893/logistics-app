import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedView, AppKeyboardAvoidingView, AppView } from '@/components/ui';
import { DURATION, SHEET_EASE } from '@/lib/motion';

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
/** Opens the sheet anyway if the screen never reports its push transition ending. */
const OPEN_FALLBACK_MS = 600;

export interface DraggableSheetProps {
  onDismiss: () => void;
  onHeightChange: (height: number) => void;
  children: ReactNode;
}

/** Bottom panel that slides up on open and is dismissed by dragging its handle down. */
export function DraggableSheet({ onDismiss, onHeightChange, children }: DraggableSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const reducedMotion = useReducedMotion();
  // Starts off-screen but stays mounted, so its measured height can place the
  // pin and camera right away. It slides up once the screen's push transition
  // ends; sliding during the push hid most of the motion behind it.
  const translateY = useSharedValue(reducedMotion ? 0 : screenHeight);

  useEffect(() => {
    if (reducedMotion) return;
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      translateY.set(withTiming(0, { duration: DURATION.sheet, easing: SHEET_EASE }));
    };
    const unsubscribe = navigation.addListener('transitionEnd', open);
    const fallback = setTimeout(open, OPEN_FALLBACK_MS);
    return () => {
      unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigation, reducedMotion, translateY]);

  // Only the handle takes the gesture, so it never fights the form's inputs.
  const dragGesture = Gesture.Pan()
    .onChange((event) => {
      translateY.set((y) => Math.max(0, y + event.changeY));
    })
    .onEnd((event) => {
      if (translateY.get() > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        translateY.set(
          withTiming(screenHeight, { duration: 200 }, (finished) => {
            if (finished) scheduleOnRN(onDismiss);
          }),
        );
      } else {
        // Spring back, carrying the finger's velocity.
        translateY.set(
          withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: event.velocityY }),
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <AppKeyboardAvoidingView
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 flex-none"
    >
      <AnimatedView
        onLayout={(event: LayoutChangeEvent) => onHeightChange(event.nativeEvent.layout.height)}
        style={animatedStyle}
        className="overflow-hidden rounded-t-2xl bg-surface shadow-lg"
      >
        <GestureDetector gesture={dragGesture}>
          <AppView
            accessibilityRole="adjustable"
            accessibilityLabel="Drag down to close"
            className="items-center py-2"
          >
            <AppView className="h-1.5 w-9 rounded-full bg-border-strong" />
          </AppView>
        </GestureDetector>
        {children}
      </AnimatedView>
    </AppKeyboardAvoidingView>
  );
}
