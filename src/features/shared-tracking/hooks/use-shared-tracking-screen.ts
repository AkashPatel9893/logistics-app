import { buildTrackingMap, type TrackingMapState } from '@/features/orders/tracking-geometry';
import { getErrorMessage } from '@/lib/api/api-error';
import { computeBounds } from '@/lib/geo';
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

  let map: TrackingMapState | null = null;
  if (tracking) {
    if (tracking.route.length >= 2) {
      const liveLocation = tracking.driverLocation
        ? {
            location: {
              latitude: tracking.driverLocation.latitude,
              longitude: tracking.driverLocation.longitude,
            },
            leg: (status === 'heading_to_pickup' || status === 'arrived_at_pickup'
              ? 'to_pickup'
              : 'to_drop') as 'to_pickup' | 'to_drop',
            path: [],
            updatedAt: new Date().toISOString(),
          }
        : null;
      map = buildTrackingMap(tracking.status, tracking.route, liveLocation);
    } else if (
      tracking.driverLocation &&
      tracking.status !== 'cancelled' &&
      tracking.status !== 'delivered'
    ) {
      const driverPoint = {
        latitude: tracking.driverLocation.latitude,
        longitude: tracking.driverLocation.longitude,
      };
      map = {
        route: [driverPoint],
        bounds: computeBounds([driverPoint], 0.004),
        endMarker: 'drop',
        showEndMarker: false,
        showStartMarker: false,
        driverPosition: driverPoint,
        driverHeading: tracking.driverLocation.heading,
        showRoute: false,
        routeMuted: false,
        arrived: false,
      };
    }
  }

  const callDriver = () => {
    if (!driver?.phone) return;
    openExternalUrl(
      `tel:${driver.phone.replace(/[^\d+]/g, '')}`,
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
