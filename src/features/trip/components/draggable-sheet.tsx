import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedView, AppKeyboardAvoidingView, AppText, AppView, Icon } from '@/components/ui';
import { DURATION, SHEET_EASE } from '@/lib/motion';

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;
/** Opens the sheet anyway if the screen never reports its push transition ending. */
const OPEN_FALLBACK_MS = 600;
/** The header doubles as the collapsed pill: same height in both states. */
const HEADER_HEIGHT = 64;
const PILL_SIDE = 16;
const PILL_GAP_BELOW = 16;
const EXPAND_SPRING = { duration: 520, dampingRatio: 0.82 } as const;
const COLLAPSE_SPRING = { duration: 440, dampingRatio: 0.9 } as const;

export interface SheetHeaderText {
  title: string;
  subtitle: string;
}

export interface DraggableSheetProps {
  onDismiss: () => void;
  onHeightChange: (height: number) => void;
  /**
   * Shrunk into a pill at the bottom (e.g. while searching the map). With `onCollapsedChange`,
   * dragging the sheet down collapses it instead of dismissing the screen, and the header (or
   * the pill) toggles it.
   */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Called once a collapse animation has finished, e.g. to open the keyboard after it. */
  onCollapseEnd?: () => void;
  /** Hides the pill too, e.g. while the keyboard is up for the map search. */
  hidden?: boolean;
  /**
   * Dark header, which is also the collapsed pill. Its text cross-fades between the two states.
   * Without it the sheet is a plain panel with a drag handle.
   */
  header?: { collapsed: SheetHeaderText; expanded: SheetHeaderText };
  children: ReactNode;
}

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/**
 * Bottom panel that slides up on open. With a `header`, it collapses into a pill made of that
 * header and expands back out of it: one element changing shape, not two swapping places.
 */
export function DraggableSheet({
  onDismiss,
  onHeightChange,
  collapsed = false,
  onCollapsedChange,
  onCollapseEnd,
  hidden = false,
  header,
  children,
}: DraggableSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const reducedMotion = useReducedMotion();
  // Starts off-screen but stays mounted, so its measured height can place the
  // pin and camera right away. It slides up once the screen's push transition
  // ends; sliding during the push hid most of the motion behind it.
  const translateY = useSharedValue(reducedMotion ? 0 : screenHeight);
  /** 1 = full sheet, 0 = pill. */
  const expanded = useSharedValue(collapsed ? 0 : 1);
  const bodyHeight = useSharedValue(0);
  const canCollapse = Boolean(onCollapsedChange && header);

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

  // While morphing, the form is drawn once into a GPU texture and only that texture fades and
  // slides: its inputs and shadows are not re-drawn every frame (the costly part on slow phones).
  const [settledCollapsed, setSettledCollapsed] = useState(collapsed);
  // With Reduce Motion the change is instant, so there is never a morph to cache.
  const isMorphing = !reducedMotion && settledCollapsed !== collapsed;

  // Morph between sheet and pill.
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const target = collapsed ? 0 : 1;
    // A drag may have left the sheet partly pulled down: it settles as part of the morph.
    translateY.set(reducedMotion ? 0 : withSpring(0, collapsed ? COLLAPSE_SPRING : EXPAND_SPRING));
    if (reducedMotion) {
      expanded.set(target);
      if (collapsed && onCollapseEnd) onCollapseEnd();
      return;
    }
    expanded.set(
      withSpring(target, collapsed ? COLLAPSE_SPRING : EXPAND_SPRING, (finished) => {
        if (!finished) return;
        scheduleOnRN(setSettledCollapsed, target === 0);
        if (target === 0 && onCollapseEnd) scheduleOnRN(onCollapseEnd);
      }),
    );
    // onCollapseEnd is read at the time of the collapse; the flag is what drives this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, reducedMotion]);

  // Out of the way (keyboard up for search): sink below the screen, come back after.
  const hiddenOffset = useSharedValue(0);
  useEffect(() => {
    hiddenOffset.set(withTiming(hidden ? 1 : 0, { duration: DURATION.small }));
  }, [hidden, hiddenOffset]);

  const toggle = () => onCollapsedChange?.(!collapsed);

  // Drag the header: down collapses (or closes the screen without a pill), up expands the pill.
  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onChange((event) => {
      if (expanded.get() > 0.5) translateY.set((y) => Math.max(0, y + event.changeY));
    })
    .onEnd((event, success) => {
      if (!success) return;
      const isOpen = expanded.get() > 0.5;
      if (!isOpen) {
        if (canCollapse && (event.translationY < -24 || event.velocityY < -400)) {
          scheduleOnRN(onCollapsedChange!, false);
        }
        return;
      }
      if (translateY.get() > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        if (canCollapse) {
          scheduleOnRN(onCollapsedChange!, true);
          return;
        }
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
  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success && canCollapse) scheduleOnRN(toggle);
  });
  const headerGesture = Gesture.Exclusive(pan, tap);

  // The morph uses only transforms, opacity and corner radii (no animated sizes or margins),
  // so it runs on the UI thread without a layout pass per frame.
  const pillBottom = insets.bottom + PILL_GAP_BELOW;
  const containerStyle = useAnimatedStyle(() => {
    const p = expanded.get();
    // Collapsed: the form slides below the screen edge and the header lifts into a floating pill.
    const collapseShift = (1 - p) * (bodyHeight.get() - pillBottom);
    return {
      transform: [
        {
          translateY: translateY.get() + collapseShift + hiddenOffset.get() * (screenHeight / 2),
        },
      ],
    };
  });
  // The dark shape behind the header: full-width sheet top, or an inset capsule.
  const { width: screenWidth } = useWindowDimensions();
  const headerShapeStyle = useAnimatedStyle(() => {
    const p = expanded.get();
    const pillRadius = HEADER_HEIGHT / 2;
    const top = interpolate(p, [0, 1], [pillRadius, 24]);
    const bottom = interpolate(p, [0, 1], [pillRadius, 0]);
    // Narrowed with a scale, not left/right, so no layout pass runs per frame. The squeeze on
    // the corners is ~7% and invisible.
    const scaleX = 1 - ((1 - p) * 2 * PILL_SIDE) / screenWidth;
    return {
      transform: [{ scaleX }],
      borderTopLeftRadius: top,
      borderTopRightRadius: top,
      borderBottomLeftRadius: bottom,
      borderBottomRightRadius: bottom,
    };
  });
  const headerStartStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - expanded.get()) * PILL_SIDE }],
  }));
  const headerEndStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(1 - expanded.get()) * PILL_SIDE },
      { rotate: `${interpolate(expanded.get(), [0, 1], [0, 180])}deg` },
    ],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.15, 0.85], [0, 1], 'clamp'),
  }));
  const expandedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.5, 1], [0, 1], 'clamp'),
  }));
  const collapsedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0, 0.5], [1, 0], 'clamp'),
  }));
  const handleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.6, 1], [0, 1], 'clamp'),
  }));

  // The camera and the pin sit above the expanded sheet, so its full height is what matters.
  const [measuredBody, setMeasuredBody] = useState(0);
  const headerHeight = header ? HEADER_HEIGHT : 22;
  useEffect(() => {
    if (measuredBody > 0) onHeightChange(headerHeight + measuredBody);
  }, [measuredBody, headerHeight, onHeightChange]);

  const handleBodyLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    bodyHeight.set(height);
    setMeasuredBody(height);
  };

  return (
    <AppKeyboardAvoidingView
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 flex-none"
    >
      {/* The keyboard is translucent on iOS: a solid strip under the sheet keeps the map from showing through it. */}
      {keyboardHeight > 0 && !collapsed ? (
        <AppView
          pointerEvents="none"
          style={{ height: keyboardHeight }}
          className="absolute inset-x-0 bottom-0 bg-surface"
        />
      ) : null}
      <AnimatedView style={containerStyle}>
        <GestureDetector gesture={headerGesture}>
          {header ? (
            <AppView
              accessible
              accessibilityRole="button"
              accessibilityLabel={collapsed ? header.collapsed.title : header.expanded.title}
              accessibilityHint={collapsed ? 'Opens the details' : 'Shrinks to show the map'}
              onAccessibilityTap={toggle}
              style={{ height: HEADER_HEIGHT }}
              className="flex-row items-center pl-2.5 pr-3"
            >
              <AnimatedView
                style={[styles.shadow, headerShapeStyle]}
                className="absolute inset-0 bg-neutral-900 dark:bg-neutral-800"
              />
              <AnimatedView
                style={handleStyle}
                className="absolute left-1/2 top-1.5 -ml-4 h-1 w-8 rounded-full bg-white/30"
              />
              <AnimatedView style={headerStartStyle} className="flex-1 flex-row items-center">
                <AppView center className="mr-3 size-11 rounded-full bg-brand">
                  <Icon name="mappin" size={20} tone="brand-foreground" />
                </AppView>
                <AppView className="h-full flex-1 justify-center pr-6">
                  <AnimatedView style={collapsedTextStyle} className="absolute inset-x-0">
                    <HeaderText {...header.collapsed} />
                  </AnimatedView>
                  <AnimatedView style={expandedTextStyle} className="absolute inset-x-0">
                    <HeaderText {...header.expanded} />
                  </AnimatedView>
                </AppView>
              </AnimatedView>
              <AnimatedView
                style={headerEndStyle}
                className="size-9 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="chevron.up" size={17} color="#FFFFFF" />
              </AnimatedView>
            </AppView>
          ) : (
            <AppView
              accessibilityRole="adjustable"
              accessibilityLabel="Drag down to close"
              className="items-center rounded-t-2xl bg-surface py-2"
            >
              <AppView className="h-1.5 w-9 rounded-full bg-border-strong" />
            </AppView>
          )}
        </GestureDetector>
        <AnimatedView
          style={bodyStyle}
          onLayout={handleBodyLayout}
          pointerEvents={collapsed ? 'none' : 'auto'}
          renderToHardwareTextureAndroid={isMorphing}
          shouldRasterizeIOS={isMorphing}
          className="bg-surface"
        >
          {children}
        </AnimatedView>
      </AnimatedView>
    </AppKeyboardAvoidingView>
  );
}

function HeaderText({ title, subtitle }: SheetHeaderText) {
  return (
    <>
      <AppText numberOfLines={1} className="text-[15px] font-bold text-white">
        {title}
      </AppText>
      <AppText numberOfLines={1} className="text-[12px] font-medium text-white/70">
        {subtitle}
      </AppText>
    </>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 16,
  },
});
