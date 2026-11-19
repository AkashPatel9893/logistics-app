import { buildTrackingMap } from '@/features/orders/tracking-geometry';
import { getErrorMessage } from '@/lib/api/api-error';
import { openExternalUrl } from '@/lib/native';
import { useLocalSearchParams, useRouter } from '@/lib/navigation';
import { useSharedTracking } from '@/queries';

export function useSharedTrackingScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const trackingQuery = useSharedTracking(token);
  const tracking = trackingQuery.data;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const status = tracking?.status;
  const driver = tracking?.driver;

  const isOnTheWay =
    status === 'heading_to_pickup' ||
    status === 'arrived_at_pickup' ||
    status === 'pickup_complete' ||
    status === 'arrived_at_drop';

  const map = tracking ? buildTrackingMap(tracking.status, tracking.route, null) : null;

  const callDriver = () => {
    if (!driver) return;
    openExternalUrl(
      `tel:${driver.phone}`,
      `Please dial ${driver.phone} manually.`,
      'Unable to call',
    );
  };

  return {
    tracking,
    map,
    isPending: trackingQuery.isPending,
    isFetching: trackingQuery.isFetching,
    errorMessage: !tracking && !trackingQuery.isPending ? getErrorMessage(trackingQuery.error) : '',
    refetch: trackingQuery.refetch,
    isOnTheWay,
    callDriver,
    close,
  };
}
