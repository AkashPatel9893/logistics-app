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

export const TRIP_UPDATES_CHANNEL_ID = 'trip-updates';

export async function configureNotifications(): Promise<void> {
  setNotificationHandler({
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

export async function hasPushPermission(): Promise<boolean> {
  const permission = await getPermissionsAsync().catch(() => null);
  return permission?.granted === true;
}

export async function requestPushPermission(): Promise<boolean> {
  const current = await getPermissionsAsync().catch(() => null);
  if (current?.granted) return true;
  if (current && !current.canAskAgain) return false;
  const answer = await requestPermissionsAsync().catch(() => null);
  return answer?.granted === true;
}

export async function getDevicePushToken(): Promise<string | null> {
  if (!(await hasPushPermission())) return null;
  try {
    const token = await getDevicePushTokenAsync();
    return typeof token.data === 'string' && token.data ? token.data : null;
  } catch {
    return null;
  }
}
