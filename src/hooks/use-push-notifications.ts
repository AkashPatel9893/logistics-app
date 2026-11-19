import { useEffect } from 'react';

import { useRouter } from '@/lib/navigation';
import {
  configureNotifications,
  useLastNotificationResponse,
  type NotificationResponse,
} from '@/lib/push';

function orderIdOf(response: NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data;
  const orderId = data?.order_id;
  return typeof orderId === 'string' && orderId ? orderId : null;
}

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
  }, [lastResponse, router]);
}
