import { useRecentDrops as useTripRecentDrops } from '@/features/trip/hooks/use-address-search';

const RECENT_DROPS_SHOWN = 2;

export function useRecentDrops() {
  const recentDrops = useTripRecentDrops(RECENT_DROPS_SHOWN);
  return { recentDrops };
}
