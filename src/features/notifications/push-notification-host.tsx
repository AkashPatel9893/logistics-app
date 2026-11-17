import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { configureNotifications } from '@/lib/push';

/** The order a notification is about, read from its data; the backend sends `order_id`. */
function orderIdOf(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data;
  const orderId = data?.order_id;
  return typeof orderId === 'string' && orderId ? orderId : null;
}

/**
 * Mounted once at the app root: sets up notifications and opens the order when a trip
 * notification is tapped, including the tap that launched the app from closed.
 */
export function PushNotificationHost() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    const orderId = orderIdOf(lastResponse ?? null);
    if (!orderId) return;
    router.push({ pathname: '/order-tracking', params: { orderId } });
    // Only a new tap should navigate; the hook keeps returning the same response until another.
  }, [lastResponse, router]);

  return null;
}
