import Constants from 'expo-constants';

import { env } from '@/config';
import { Alert, openExternalUrl } from '@/lib/native';
import { useIdentity, useProfileQuery, useSavedAddresses, useWallet } from '@/queries';
import { getDisplayName, signOut, useAuthStore, useTripStore } from '@/stores';

export function useAccountOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: currentUser } = useProfileQuery();
  const { data: identity } = useIdentity();
  const credits = useWallet().data?.balance ?? 0;
  const savedCount = (useSavedAddresses().data ?? []).filter((a) => a.label !== 'recent').length;

  const name = getDisplayName(user);
  const phone = currentUser?.phone || user?.phone;
  const version = Constants.expoConfig?.version;

  const handleBusinessEnquiry = () => {
    openExternalUrl(
      env.BUSINESS_ENQUIRY_URL,
      'Could not open the business enquiry page in your browser.',
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          useTripStore.getState().reset();
          signOut();
        },
      },
    ]);
  };

  return {
    name,
    phone,
    identity,
    credits,
    savedCount,
    version,
    handleBusinessEnquiry,
    handleLogout,
  };
}
