import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  AnimatedView,
  AppBottomSheet,
  AppKeyboardAvoidingView,
  AppPressable,
  AppText,
  AppView,
  Icon,
  useAppSafeAreaInsets,
  type Detent,
  type SurfaceStyle,
} from '@/components/ui';
import {
  DURATION,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from '@/lib/motion';
import type { LayoutChangeEvent } from '@/lib/native';

const HEADER_HEIGHT = 64;
const PILL_SIDE = 16;
const PILL_GAP_BELOW = 16;

export interface SheetHeaderText {
  title: string;
  subtitle: string;
}

export interface DraggableSheetProps {
  onDismiss: () => void;
  onHeightChange: (height: number) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onCollapseEnd?: () => void;
  hidden?: boolean;
  header?: { collapsed: SheetHeaderText; expanded: SheetHeaderText };
  children: ReactNode;
}

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
  const insets = useAppSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const canCollapse = Boolean(onCollapsedChange && header);

  const [measuredBody, setMeasuredBody] = useState(0);
  const headerHeight = header ? HEADER_HEIGHT : 22;

  useEffect(() => {
    if (measuredBody > 0) onHeightChange(headerHeight + measuredBody);
  }, [measuredBody, headerHeight, onHeightChange]);

  const handleBodyLayout = (event: LayoutChangeEvent) => {
    setMeasuredBody(event.nativeEvent.layout.height);
  };

  const expanded = useSharedValue(collapsed ? 0 : 1);
  const wasExpandedRef = useRef(!collapsed);

  useEffect(() => {
    if (!collapsed) wasExpandedRef.current = true;
    const target = collapsed ? 0 : 1;
    expanded.set(reducedMotion ? target : withTiming(target, { duration: DURATION.sheet }));
  }, [collapsed, expanded, reducedMotion]);

  const expandedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.4, 1], [0, 1], 'clamp'),
  }));
  const collapsedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0, 0.6], [1, 0], 'clamp'),
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expanded.get(), [0, 1], [0, 180])}deg` }],
  }));
  const handleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.6, 1], [0, 1], 'clamp'),
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expanded.get(), [0.15, 0.7], [0, 1], 'clamp'),
  }));

  const detents: Detent[] = canCollapse
    ? [
        { value: 0, programmatic: true },
        {
          value: HEADER_HEIGHT,
          insets: { bottom: insets.bottom + PILL_GAP_BELOW, start: PILL_SIDE, end: PILL_SIDE },
        },
        'content',
      ]
    : [0, 'content'];

  const index = canCollapse ? (hidden ? 0 : collapsed ? 1 : 2) : hidden ? 0 : 1;

  const surfaceStyle: SurfaceStyle =
    canCollapse && collapsed
      ? {
          borderRadius: HEADER_HEIGHT / 2,
          boxShadow: '0 -2px 14px rgba(0, 0, 0, 0.18)',
          elevation: 16,
        }
      : {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: '0 -2px 14px rgba(0, 0, 0, 0.18)',
          elevation: 16,
        };

  const handleIndexChange = (nextIndex: number) => {
    if (canCollapse) {
      if (nextIndex === 1) onCollapsedChange?.(true);
      else if (nextIndex === 2) onCollapsedChange?.(false);
    } else if (nextIndex === 0) {
      onDismiss();
    }
  };

  const handleSettle = (settledIndex: number) => {
    if (canCollapse && settledIndex === 1 && wasExpandedRef.current) {
      wasExpandedRef.current = false;
      onCollapseEnd?.();
    }
  };

  const toggle = () => onCollapsedChange?.(!collapsed);

  return (
    <AppKeyboardAvoidingView
      pointerEvents="box-none"
      enabled={!collapsed && !hidden}
      behavior="padding"
      className="absolute inset-0"
    >
      <AppBottomSheet
        index={index}
        detents={detents}
        onIndexChange={handleIndexChange}
        onSettle={handleSettle}
        animateContentHeight={!canCollapse}
        surface={
          <AppView
            className={
              canCollapse && collapsed
                ? 'flex-1 bg-neutral-900 dark:bg-neutral-800'
                : 'flex-1 bg-surface'
            }
          />
        }
        surfaceStyle={surfaceStyle}
      >
        {header ? (
          <AppPressable
            onPress={canCollapse ? toggle : undefined}
            pressScale={1}
            accessibilityRole="button"
            accessibilityLabel={collapsed ? header.collapsed.title : header.expanded.title}
            accessibilityHint={collapsed ? 'Opens the details' : 'Shrinks to show the map'}
            className="h-16 flex-row items-center bg-neutral-900 pl-2.5 pr-3 dark:bg-neutral-800"
          >
            <AnimatedView
              style={handleStyle}
              className="pointer-events-none absolute left-1/2 top-1.5 -ml-4 h-1 w-8 rounded-full bg-white/30"
            />
            <AppView className="flex-1 flex-row items-center">
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
            </AppView>
            <AnimatedView
              style={chevronStyle}
              className="size-9 items-center justify-center rounded-full bg-white/15"
            >
              <Icon name="chevron.up" size={17} color="#FFFFFF" />
            </AnimatedView>
          </AppPressable>
        ) : (
          <AppView
            accessibilityRole="adjustable"
            accessibilityLabel="Drag down to close"
            className="items-center bg-surface py-2"
          >
            <AppView className="h-1.5 w-9 rounded-full bg-border-strong" />
          </AppView>
        )}
        <AnimatedView
          onLayout={handleBodyLayout}
          pointerEvents={collapsed ? 'none' : 'auto'}
          style={canCollapse ? bodyStyle : undefined}
          className="bg-surface"
        >
          {children}
        </AnimatedView>
      </AppBottomSheet>
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
