import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PushNotificationHost() {
  usePushNotifications();
  return null;
}
