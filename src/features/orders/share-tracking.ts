import type { TrackingShare } from '@/lib/api/models';
import { shareText } from '@/lib/native';

export async function shareTrackingLink(
  share: TrackingShare,
  senderName: string,
  deliveryOtp: string,
): Promise<void> {
  const lines = [
    `${senderName} is sending you a package with RYNO.`,
    `Track it live: ${share.url}`,
    ...(deliveryOtp
      ? [`Delivery code: ${deliveryOtp}. Give it to the driver only when your package arrives.`]
      : []),
  ];
  await shareText(lines.join('\n'));
}
