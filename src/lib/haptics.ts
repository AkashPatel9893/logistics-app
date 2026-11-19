import * as ExpoHaptics from 'expo-haptics';

const run = (effect: () => Promise<void>) => {
  effect().catch(() => undefined);
};

export const haptics = {
  selection: () => run(() => ExpoHaptics.selectionAsync()),
  tap: () => run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light)),
  success: () =>
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success)),
  error: () => run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error)),
};
