import { useQuery } from '@tanstack/react-query';

import { directionsApi } from '@/lib/api/directions';
import type { GeoPoint } from '@/lib/api/models';

import { queryKeys } from './keys';

export function useRoadRoute(
  id: string,
  from: GeoPoint | null,
  to: GeoPoint | null,
  via: GeoPoint[] = [],
) {
  return useQuery({
    queryKey: queryKeys.roadRoute(id),
    queryFn: ({ signal }) => directionsApi.getRoadRoute(from!, to!, via, signal),
    enabled: Boolean(from && to),
    staleTime: Infinity,
    retry: 1,
  });
}
