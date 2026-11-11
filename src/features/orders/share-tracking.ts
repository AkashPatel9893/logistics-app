import { Share } from 'react-native';

import type { TrackingShare } from '@/lib/api/models';

/** Opens the share sheet with the receiver's live-tracking link. */
export async function shareTrackingLink(
  share: TrackingShare,
  senderName: string,
  /** Empty until a driver is assigned: the link is shared without a code then. */
  deliveryOtp: string,
): Promise<void> {
  const lines = [
    `${senderName} is sending you a package with RYNO.`,
    `Track it live: ${share.url}`,
    ...(deliveryOtp
      ? [`Delivery code: ${deliveryOtp}. Give it to the driver only when your package arrives.`]
      : []),
  ];
  await Share.share({ message: lines.join('\n') });
}
