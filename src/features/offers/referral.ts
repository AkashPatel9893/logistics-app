import { Alert, Share } from 'react-native';

import type { AuthUser } from '@/features/auth/types';

const REFERRAL_REWARD = 100;

/** Prototype referral code derived from the user ID; the backend will issue real codes. */
export function getReferralCode(user: AuthUser | null): string {
  const suffix = (user?.id ?? 'guest')
    .replace(/[^a-z0-9]/gi, '')
    .slice(-6)
    .toUpperCase();
  return `RYNO${suffix}`;
}

/** Opens the system share sheet with the user's referral invite. */
export async function shareReferral(user: AuthUser | null): Promise<void> {
  const code = getReferralCode(user);
  try {
    await Share.share({
      message: `Send parcels across the city with RYNO. Use my code ${code} and we both get ₹${REFERRAL_REWARD} off.`,
    });
  } catch {
    Alert.alert('Unable to share', `Your referral code is ${code}.`);
  }
}
