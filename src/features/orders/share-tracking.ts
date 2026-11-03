import { Share } from 'react-native';

import type { TrackingShare } from '@/lib/api/models';

/** Opens the share sheet with the receiver's live-tracking link. */
export async function shareTrackingLink(
  share: TrackingShare,
  senderName: string,
  deliveryOtp: string,
): Promise<void> {
  const lines = [
    `${senderName} is sending you a package with RYNO.`,
    `Track it live: ${share.url}`,
    `Delivery code: ${deliveryOtp}. Give it to the driver only when your package arrives.`,
  ];
  await Share.share({ message: lines.join('\n') });
}
