import { Modal, Pressable, StyleSheet } from 'react-native';
import { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { AnimatedView, AppText, AppView, Button, Icon, type IconName } from '@/components/ui';
import { DURATION } from '@/lib/motion';

/** The situations the app explains to the customer, each with its own wording. */
export type LocationPromptKind = 'ask' | 'blocked' | 'services-off';

export type LocationPromptChoice = 'primary' | 'secondary';

interface PromptContent {
  icon: IconName;
  title: string;
  body: string;
  primary: string;
  secondary: string;
}

const CONTENT: Record<LocationPromptKind, PromptContent> = {
  ask: {
    icon: 'location.north.fill',
    title: 'Allow location access',
    body: 'We use your location to set your pickup point automatically, so booking takes just a few taps. Your location is used only while you use the app.',
    primary: 'Allow location',
    secondary: 'Enter address manually',
  },
  blocked: {
    icon: 'location',
    title: 'Location permission is off',
    body: 'To detect your pickup point automatically, allow location access for Ryno in Settings › Permissions › Location.',
    primary: 'Open Settings',
    secondary: 'Not now',
  },
  'services-off': {
    icon: 'location',
    title: 'Turn on device location',
    body: 'Your phone’s location is turned off. Turn it on so we can find your pickup point accurately.',
    primary: 'Open Settings',
    secondary: 'Not now',
  },
};

type PromptState = {
  kind: LocationPromptKind | null;
  resolve: ((choice: LocationPromptChoice) => void) | null;
};

const usePromptStore = create<PromptState>(() => ({ kind: null, resolve: null }));

/**
 * Shows the location sheet and resolves with the customer's choice. One at a time: a new
 * request while one is open answers the open one with "secondary" first.
 */
export function showLocationPrompt(kind: LocationPromptKind): Promise<LocationPromptChoice> {
  return new Promise((resolve) => {
    usePromptStore.getState().resolve?.('secondary');
    usePromptStore.setState({ kind, resolve });
  });
}

function answer(choice: LocationPromptChoice) {
  const { resolve } = usePromptStore.getState();
  usePromptStore.setState({ kind: null, resolve: null });
  resolve?.(choice);
}

/** Mounted once at the app root; renders the sheet when one is requested. */
export function LocationPromptHost() {
  const kind = usePromptStore((state) => state.kind);
  const insets = useSafeAreaInsets();
  const content = kind ? CONTENT[kind] : null;

  return (
    <Modal
      visible={kind !== null}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={() => answer('secondary')}
    >
      {content ? (
        <AppView className="flex-1 justify-end">
          <AnimatedView
            entering={FadeIn.duration(DURATION.enter)}
            exiting={FadeOut.duration(DURATION.small)}
            style={StyleSheet.absoluteFill}
          >
            <Pressable
              accessibilityLabel="Close"
              onPress={() => answer('secondary')}
              style={styles.backdrop}
            />
          </AnimatedView>
          <AnimatedView
            entering={SlideInDown.springify().damping(20).stiffness(180)}
            exiting={SlideOutDown.duration(DURATION.small)}
            accessibilityViewIsModal
            style={{ paddingBottom: insets.bottom + 16 }}
            className="rounded-t-[28px] bg-surface px-6 pt-3"
          >
            <AppView className="mb-5 items-center">
              <AppView className="h-1 w-10 rounded-full bg-border-strong" />
            </AppView>

            {/* Layered rings around the icon, the way ride apps illustrate location. */}
            <AppView className="mb-5 items-center">
              <AppView center className="size-24 rounded-full bg-brand-tint">
                <AppView center className="size-16 rounded-full bg-brand/20">
                  <AppView center className="size-11 rounded-full bg-brand">
                    <Icon name={content.icon} size={22} tone="brand-foreground" />
                  </AppView>
                </AppView>
              </AppView>
            </AppView>

            <AppText
              accessibilityRole="header"
              className="text-center text-[21px] font-bold text-foreground"
            >
              {content.title}
            </AppText>
            <AppText className="mt-2 text-center text-[14px] leading-[21px] text-muted">
              {content.body}
            </AppText>

            <Button
              label={content.primary}
              variant="brand"
              onPress={() => answer('primary')}
              className="mt-6 h-auto py-3.5"
              textClassName="text-[15px]"
            />
            <Button
              label={content.secondary}
              variant="ghost"
              onPress={() => answer('secondary')}
              className="mt-1 h-auto py-3"
              textClassName="text-[14px]"
            />
          </AnimatedView>
        </AppView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
});
