import { useEffect } from 'react';

import { useRouter } from '@/lib/navigation';
import {
  configureNotifications,
  useLastNotificationResponse,
  type NotificationResponse,
} from '@/lib/push';

/** The order a notification is about, read from its data; the backend sends `order_id`. */
function orderIdOf(response: NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data;
  const orderId = data?.order_id;
  return typeof orderId === 'string' && orderId ? orderId : null;
}

/** Sets up notification channels/handlers and opens an order when a trip notification is tapped. */
export function usePushNotifications(): void {
  const router = useRouter();
  const lastResponse = useLastNotificationResponse();

  useEffect(() => {
    void configureNotifications();
  }, []);

  useEffect(() => {
    const orderId = orderIdOf(lastResponse ?? null);
    if (!orderId) return;
    router.push({ pathname: '/order-tracking', params: { orderId } });
    // Only a new tap should navigate; the hook keeps returning the same response until another.
  }, [lastResponse, router]);
}
