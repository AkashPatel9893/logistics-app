import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import type { Order } from '@/lib/api/models';
import { Alert, openExternalUrl, shareText } from '@/lib/native';
import { useCancelOrder, useRateOrder, useShareTracking } from '@/queries';

import { shareTrackingLink } from '../share-tracking';

export function useOrderTrackingActions(
  order: Order | undefined,
  options?: { onCancelled?: () => void },
) {
  const cancelOrder = useCancelOrder();
  const rateOrder = useRateOrder();
  const shareTracking = useShareTracking();
  const [userRating, setUserRating] = useState<number | null>(null);

  const handleContactDriver = () => {
    if (!order?.driver?.phone) return;
    openExternalUrl(
      `tel:${order.driver.phone}`,
      `Please dial ${order.driver.phone} manually.`,
      'Unable to call',
    );
  };

  const handleCancel = ({ code, text }: { code: string; text: string }) => {
    if (!order) return;
    cancelOrder.mutate(
      { id: order.id, reasonCode: code, reasonText: text },
      {
        onSuccess: () => options?.onCancelled?.(),
        onError: (error) => Alert.alert('Something went wrong', getErrorMessage(error)),
      },
    );
  };

  const handleRate = (rating: number) => {
    if (!order) return;
    rateOrder.mutate(
      { id: order.id, rating },
      {
        onSuccess: () => setUserRating(rating),
        onError: () =>
          Alert.alert(
            'Rating not saved',
            'We could not save your rating right now. Please try again later.',
          ),
      },
    );
  };

  const handleShare = async (stopId?: string, code = order?.deliveryOtp) => {
    if (!order) return;
    try {
      const link = await shareTracking.mutateAsync({ id: order.id, stopId });
      await shareTrackingLink(link, order.pickup.contact?.name || 'Someone', code ?? '');
    } catch {
      await shareText(
        code
          ? `Your RYNO delivery #${order.number} is on the way. Give this code to the driver only when you receive the parcel: ${code}`
          : `Your RYNO delivery #${order.number} has been booked.`,
      );
    }
  };

  return {
    userRating,
    isCancelling: cancelOrder.isPending,
    isRating: rateOrder.isPending,
    isSharing: shareTracking.isPending,
    handleContactDriver,
    handleCancel,
    handleRate,
    handleShare,
  };
}
