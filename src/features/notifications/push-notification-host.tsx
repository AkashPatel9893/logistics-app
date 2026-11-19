import { usePushNotifications } from '@/hooks/use-push-notifications';

/**
 * Mounted once at the app root: sets up notifications and opens the order when a trip
 * notification is tapped, including the tap that launched the app from closed.
 */
export function PushNotificationHost() {
  usePushNotifications();
  return null;
}
