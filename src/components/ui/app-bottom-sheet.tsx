import {
  BottomSheet,
  BottomSheetProvider,
  ModalBottomSheet,
  type BottomSheetProps,
  type Detent,
  type ModalBottomSheetProps,
  type ModalDetent,
  type PositionChangeEventData,
  type ScrollCoordination,
  type SurfaceStyle,
} from '@swmansion/react-native-bottom-sheet';
import type { ReactNode } from 'react';

import { AppView } from './app-view';

export type {
  BottomSheetProps,
  Detent,
  ModalBottomSheetProps,
  ModalDetent,
  PositionChangeEventData,
  ScrollCoordination,
  SurfaceStyle,
};

const DEFAULT_SURFACE_STYLE: SurfaceStyle = {
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  borderCurve: 'continuous',
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
  elevation: 12,
};

const DEFAULT_SCROLL_COORDINATION: ScrollCoordination = {
  expand: 'handoff',
  collapse: 'initial',
};

const DEFAULT_SCRIM_COLOR = 'rgba(0, 0, 0, 0.45)';

function DefaultSurfaceFill() {
  return <AppView className="flex-1 bg-surface" />;
}

export function AppBottomSheetProvider({ children }: { children: ReactNode }) {
  return <BottomSheetProvider>{children}</BottomSheetProvider>;
}

export function AppBottomSheet({
  surface,
  surfaceStyle,
  scrollCoordination = DEFAULT_SCROLL_COORDINATION,
  ...props
}: BottomSheetProps) {
  return (
    <BottomSheet
      surface={surface ?? <DefaultSurfaceFill />}
      surfaceStyle={surfaceStyle ? [DEFAULT_SURFACE_STYLE, surfaceStyle] : DEFAULT_SURFACE_STYLE}
      scrollCoordination={scrollCoordination}
      {...props}
    />
  );
}

export interface AppModalBottomSheetProps extends ModalBottomSheetProps {
  onClose?: () => void;
}

export function AppModalBottomSheet({
  lazy = true,
  scrimColor = DEFAULT_SCRIM_COLOR,
  surface,
  surfaceStyle,
  onClose,
  onCloseRequest,
  onIndexChange,
  ...props
}: AppModalBottomSheetProps) {
  return (
    <ModalBottomSheet
      lazy={lazy}
      scrimColor={scrimColor}
      surface={surface ?? <DefaultSurfaceFill />}
      surfaceStyle={surfaceStyle ? [DEFAULT_SURFACE_STYLE, surfaceStyle] : DEFAULT_SURFACE_STYLE}
      onCloseRequest={onCloseRequest ?? onClose}
      onIndexChange={(nextIndex) => {
        onIndexChange?.(nextIndex);
        if (nextIndex === 0) onClose?.();
      }}
      {...props}
    />
  );
}
