import * as ExpoHaptics from 'expo-haptics';

/** Fire-and-forget haptics: a device without a haptic engine must never break the UI. */
const run = (effect: () => Promise<void>) => {
  effect().catch(() => undefined);
};

export const haptics = {
  /** A single digit typed or an option picked. */
  selection: () => run(() => ExpoHaptics.selectionAsync()),
  tap: () => run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light)),
  success: () =>
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success)),
  error: () => run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error)),
};
