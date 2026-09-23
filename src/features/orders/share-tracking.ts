import { Share } from 'react-native';

import { IS_MOCK_API } from '@/lib/api/config';
import type { TrackingShare } from '@/lib/api/models';

const APP_SCHEME = 'logisticsapp';

/** Opens the share sheet with the receiver's live-tracking link. */
export async function shareTrackingLink(share: TrackingShare, senderName: string): Promise<void> {
  const lines = [
    `${senderName} is sending you a package with RYNO.`,
    `Track it live: ${share.url}`,
    'Share the delivery OTP on that page with the driver only when your package arrives.',
  ];
  // No web domain exists yet — in the prototype the link opens the app directly.
  if (IS_MOCK_API) lines.push(`Open in the RYNO app: ${APP_SCHEME}://track/${share.token}`);
  await Share.share({ message: lines.join('\n') });
}
