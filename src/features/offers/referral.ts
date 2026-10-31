import { Alert } from 'react-native';

import type { AuthUser } from '@/features/auth/types';

/** Referral codes and rewards must come from the backend before they can be shared. */
export async function shareReferral(_user: AuthUser | null): Promise<void> {
  Alert.alert('Referral unavailable', 'Referral sharing is not available yet.');
}
