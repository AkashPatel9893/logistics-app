import {
  AndroidImportance,
  getDevicePushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  useLastNotificationResponse,
  type NotificationResponse,
} from 'expo-notifications';

import { Platform } from '@/lib/native';

export { useLastNotificationResponse, type NotificationResponse };

/** Android channel for live trip updates (driver assigned, arriving, delivered). */
export const TRIP_UPDATES_CHANNEL_ID = 'trip-updates';

/** Prepares how notifications show and the Android channel. Safe to call more than once. */
export async function configureNotifications(): Promise<void> {
  setNotificationHandler({
    // Trip updates are worth seeing even while the app is open.
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(TRIP_UPDATES_CHANNEL_ID, {
      name: 'Trip updates',
      importance: AndroidImportance.HIGH,
    }).catch(() => undefined);
  }
}

/** Whether the customer has allowed notifications; never prompts. */
export async function hasPushPermission(): Promise<boolean> {
  const permission = await getPermissionsAsync().catch(() => null);
  return permission?.granted === true;
}

/**
 * Asks for notification permission once, at a moment the customer cares (after a booking is
 * placed). Returns whether it is allowed. Does nothing when the customer already decided no.
 */
export async function requestPushPermission(): Promise<boolean> {
  const current = await getPermissionsAsync().catch(() => null);
  if (current?.granted) return true;
  if (current && !current.canAskAgain) return false;
  const answer = await requestPermissionsAsync().catch(() => null);
  return answer?.granted === true;
}

/**
 * This device's native push token (FCM on Android, APNs on iOS) when notifications are allowed,
 * else null. It also returns null when the build has no push credentials (for example Android
 * without Firebase set up), so callers must treat a missing token as normal.
 */
export async function getDevicePushToken(): Promise<string | null> {
  if (!(await hasPushPermission())) return null;
  try {
    const token = await getDevicePushTokenAsync();
    return typeof token.data === 'string' && token.data ? token.data : null;
  } catch {
    return null;
  }
}
